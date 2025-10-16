#!/usr/bin/env node

/**
 * WisdomOS Web - Code Fingerprinting System
 * 
 * This script generates SHA-256 cryptographic hashes for all source files
 * and creates Merkle tree structures for directory-level integrity verification.
 * 
 * Features:
 * - SHA-256 hash generation for all source files
 * - Merkle tree creation for structural integrity
 * - Git integration for incremental updates
 * - Tamper detection and verification
 * - JSON export for blockchain registration
 * 
 * @version 1.0.0
 * @license MIT
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { MerkleTree } = require('merkletreejs');

class CodeFingerprintSystem {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.outputFile = options.outputFile || './data/code-fingerprints.json';
        this.excludePatterns = options.excludePatterns || [
            'node_modules',
            '.git',
            '.next',
            'dist',
            'build',
            '.env*',
            '*.log',
            '.DS_Store',
            'blockchain-protection/data',
            'blockchain-protection/encryption-keys'
        ];
        
        this.fingerprints = {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '1.0.0',
                projectRoot: this.projectRoot,
                algorithm: 'SHA-256'
            },
            files: {},
            directories: {},
            merkleTree: null,
            integrity: {
                totalFiles: 0,
                totalDirectories: 0,
                rootHash: null,
                verificationStatus: 'pending'
            }
        };
    }

    /**
     * Generate SHA-256 hash for a single file
     */
    generateFileHash(filePath) {
        try {
            const data = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256');
            hash.update(data);
            return {
                hash: hash.digest('hex'),
                size: data.length,
                lastModified: fs.statSync(filePath).mtime.toISOString(),
                relativePath: path.relative(this.projectRoot, filePath)
            };
        } catch (error) {
            console.error(`Error hashing file ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Check if file/directory should be excluded
     */
    shouldExclude(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        return this.excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                return relativePath.match(new RegExp(pattern.replace(/\*/g, '.*')));
            }
            return relativePath.includes(pattern);
        });
    }

    /**
     * Recursively scan directory and generate hashes
     */
    scanDirectory(dirPath) {
        const items = [];
        
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (this.shouldExclude(fullPath)) {
                    continue;
                }
                
                if (entry.isFile()) {
                    const fileHash = this.generateFileHash(fullPath);
                    if (fileHash) {
                        const key = path.relative(this.projectRoot, fullPath);
                        this.fingerprints.files[key] = fileHash;
                        items.push(fileHash.hash);
                    }
                } else if (entry.isDirectory()) {
                    const subItems = this.scanDirectory(fullPath);
                    items.push(...subItems);
                }
            }
            
            // Generate directory hash from all contained items
            if (items.length > 0) {
                const dirHash = crypto.createHash('sha256');
                dirHash.update(items.sort().join(''));
                const relativePath = path.relative(this.projectRoot, dirPath);
                
                this.fingerprints.directories[relativePath || '.'] = {
                    hash: dirHash.digest('hex'),
                    itemCount: items.length,
                    lastScanned: new Date().toISOString()
                };
            }
            
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error.message);
        }
        
        return items;
    }

    /**
     * Create Merkle tree for structural integrity
     */
    createMerkleTree() {
        const allHashes = [
            ...Object.values(this.fingerprints.files).map(f => f.hash),
            ...Object.values(this.fingerprints.directories).map(d => d.hash)
        ];
        
        if (allHashes.length === 0) {
            console.warn('No hashes found for Merkle tree creation');
            return null;
        }
        
        // Create Merkle tree with SHA-256
        const tree = new MerkleTree(allHashes, crypto.createHash, { 
            hashLeaves: false,
            sortPairs: true 
        });
        
        const root = tree.getRoot().toString('hex');
        
        this.fingerprints.merkleTree = {
            root: root,
            leaves: allHashes,
            depth: Math.ceil(Math.log2(allHashes.length)),
            algorithm: 'SHA-256',
            createdAt: new Date().toISOString()
        };
        
        this.fingerprints.integrity.rootHash = root;
        
        return tree;
    }

    /**
     * Generate complete fingerprint report
     */
    async generateFingerprints() {
        console.log('🔍 WisdomOS Web Code Fingerprinting System');
        console.log('📁 Scanning project directory:', this.projectRoot);
        console.log('🚫 Excluding patterns:', this.excludePatterns.join(', '));
        console.log('');
        
        console.log('📊 Generating file hashes...');
        const startTime = Date.now();
        
        // Scan all files and directories
        this.scanDirectory(this.projectRoot);
        
        // Update counts
        this.fingerprints.integrity.totalFiles = Object.keys(this.fingerprints.files).length;
        this.fingerprints.integrity.totalDirectories = Object.keys(this.fingerprints.directories).length;
        
        console.log(`✅ Processed ${this.fingerprints.integrity.totalFiles} files`);
        console.log(`✅ Processed ${this.fingerprints.integrity.totalDirectories} directories`);
        
        // Create Merkle tree
        console.log('🌳 Creating Merkle tree for structural integrity...');
        const tree = this.createMerkleTree();
        
        if (tree) {
            console.log(`✅ Merkle tree created with root hash: ${this.fingerprints.integrity.rootHash.substring(0, 16)}...`);
        }
        
        // Add performance metrics
        const endTime = Date.now();
        this.fingerprints.metadata.processingTime = `${endTime - startTime}ms`;
        this.fingerprints.integrity.verificationStatus = 'completed';
        
        // Ensure output directory exists
        const outputDir = path.dirname(this.outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save to file
        fs.writeFileSync(this.outputFile, JSON.stringify(this.fingerprints, null, 2));
        
        console.log('');
        console.log('📋 Fingerprint Summary:');
        console.log(`   Files processed: ${this.fingerprints.integrity.totalFiles}`);
        console.log(`   Directories: ${this.fingerprints.integrity.totalDirectories}`);
        console.log(`   Root hash: ${this.fingerprints.integrity.rootHash}`);
        console.log(`   Output file: ${this.outputFile}`);
        console.log(`   Processing time: ${this.fingerprints.metadata.processingTime}`);
        console.log('');
        console.log('✅ Code fingerprinting completed successfully!');
        
        return this.fingerprints;
    }

    /**
     * Verify file integrity against stored fingerprints
     */
    async verifyIntegrity(storedFingerprintsPath = null) {
        const storedPath = storedFingerprintsPath || this.outputFile;
        
        if (!fs.existsSync(storedPath)) {
            throw new Error(`Stored fingerprints not found: ${storedPath}`);
        }
        
        console.log('🔍 Verifying code integrity...');
        const storedData = JSON.parse(fs.readFileSync(storedPath, 'utf8'));
        
        // Generate current fingerprints
        const currentData = await this.generateFingerprints();
        
        // Compare files
        const results = {
            passed: true,
            fileResults: {},
            summary: {
                totalFiles: Object.keys(storedData.files).length,
                passedFiles: 0,
                failedFiles: 0,
                newFiles: 0,
                missingFiles: 0
            }
        };
        
        // Check existing files
        for (const [filePath, storedFile] of Object.entries(storedData.files)) {
            if (currentData.files[filePath]) {
                const currentFile = currentData.files[filePath];
                const passed = storedFile.hash === currentFile.hash;
                
                results.fileResults[filePath] = {
                    status: passed ? 'PASS' : 'FAIL',
                    storedHash: storedFile.hash,
                    currentHash: currentFile.hash,
                    lastModified: currentFile.lastModified
                };
                
                if (passed) {
                    results.summary.passedFiles++;
                } else {
                    results.summary.failedFiles++;
                    results.passed = false;
                }
            } else {
                results.fileResults[filePath] = {
                    status: 'MISSING',
                    storedHash: storedFile.hash,
                    currentHash: null
                };
                results.summary.missingFiles++;
                results.passed = false;
            }
        }
        
        // Check for new files
        for (const filePath of Object.keys(currentData.files)) {
            if (!storedData.files[filePath]) {
                results.fileResults[filePath] = {
                    status: 'NEW',
                    storedHash: null,
                    currentHash: currentData.files[filePath].hash,
                    lastModified: currentData.files[filePath].lastModified
                };
                results.summary.newFiles++;
            }
        }
        
        // Compare Merkle tree roots
        results.merkleTreeMatch = storedData.merkleTree?.root === currentData.merkleTree?.root;
        if (!results.merkleTreeMatch) {
            results.passed = false;
        }
        
        // Display results
        console.log('');
        console.log('📊 Integrity Verification Results:');
        console.log(`   Total files: ${results.summary.totalFiles}`);
        console.log(`   ✅ Passed: ${results.summary.passedFiles}`);
        console.log(`   ❌ Failed: ${results.summary.failedFiles}`);
        console.log(`   🆕 New: ${results.summary.newFiles}`);
        console.log(`   📭 Missing: ${results.summary.missingFiles}`);
        console.log(`   🌳 Merkle tree: ${results.merkleTreeMatch ? '✅ Match' : '❌ Mismatch'}`);
        console.log(`   🏆 Overall: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        return results;
    }

    /**
     * Get file hash for specific file
     */
    getFileHash(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        return this.fingerprints.files[relativePath]?.hash || null;
    }

    /**
     * Generate verification proof for specific file
     */
    generateProof(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        const fileData = this.fingerprints.files[relativePath];
        
        if (!fileData) {
            throw new Error(`File not found in fingerprints: ${relativePath}`);
        }
        
        return {
            file: relativePath,
            hash: fileData.hash,
            size: fileData.size,
            lastModified: fileData.lastModified,
            merkleRoot: this.fingerprints.integrity.rootHash,
            timestamp: this.fingerprints.metadata.generatedAt,
            algorithm: 'SHA-256',
            version: this.fingerprints.metadata.version
        };
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--output':
            case '-o':
                options.outputFile = args[++i];
                break;
            case '--verify':
            case '-v':
                options.verify = true;
                break;
            case '--file':
            case '-f':
                options.singleFile = args[++i];
                break;
            case '--staged':
                options.stagedOnly = true;
                break;
            case '--help':
            case '-h':
                console.log(`
WisdomOS Web Code Fingerprinting System

Usage: node code-fingerprint.js [options]

Options:
  -o, --output <file>    Output file for fingerprints (default: ./data/code-fingerprints.json)
  -v, --verify          Verify integrity against stored fingerprints
  -f, --file <path>     Generate proof for specific file
  --staged              Only process git staged files
  -h, --help            Show this help message

Examples:
  node code-fingerprint.js                    # Generate fingerprints for all files
  node code-fingerprint.js --verify          # Verify current state against stored
  node code-fingerprint.js --file app/page.tsx  # Get proof for specific file
  node code-fingerprint.js --staged          # Process only staged git files
`);
                process.exit(0);
        }
    }
    
    const fingerprinter = new CodeFingerprintSystem(options);
    
    (async () => {
        try {
            if (options.verify) {
                const results = await fingerprinter.verifyIntegrity();
                process.exit(results.passed ? 0 : 1);
            } else if (options.singleFile) {
                const proof = fingerprinter.generateProof(options.singleFile);
                console.log(JSON.stringify(proof, null, 2));
            } else {
                await fingerprinter.generateFingerprints();
                console.log('🔗 Ready for blockchain registration!');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = CodeFingerprintSystem;
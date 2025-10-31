## 📋 Pull Request Description

### Summary
<!-- Provide a brief description of the changes in this PR -->

### Type of Change
<!-- Mark with an 'x' the type of change this PR introduces -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📖 Documentation update
- [ ] 🔧 Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security improvement
- [ ] 🧪 Test addition or improvement
- [ ] 🔄 CI/CD pipeline changes

### Related Issues
<!-- Link to any related issues -->
Fixes #(issue number)
Relates to #(issue number)

---

## 🧪 Testing

### Testing Performed
<!-- Describe the testing you've performed -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed
- [ ] Accessibility testing performed

### Test Cases
<!-- List specific test cases covered -->
1. 
2. 
3. 

### Test Environment
<!-- Where was this tested? -->
- [ ] Local development
- [ ] Staging environment
- [ ] Production-like environment

---

## 📸 Screenshots/Demo
<!-- Add screenshots or demo videos if applicable -->

### Before
<!-- Screenshots/demo of the current state -->

### After
<!-- Screenshots/demo of the new state -->

---

## 🔍 Code Review Checklist

### General
- [ ] Code follows the project's coding standards
- [ ] Self-review completed
- [ ] Code is properly commented and documented
- [ ] No debugging code or console.logs left in
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

### Security
- [ ] No sensitive data exposed
- [ ] Input validation implemented where needed
- [ ] Authentication/authorization properly handled
- [ ] Security best practices followed

### Frontend (if applicable)
- [ ] Component is responsive across devices
- [ ] Accessibility guidelines followed (WCAG 2.1)
- [ ] Performance optimized (lazy loading, code splitting)
- [ ] Cross-browser compatibility considered
- [ ] SEO considerations addressed

### Backend (if applicable)
- [ ] API endpoints properly documented
- [ ] Database queries optimized
- [ ] Proper error responses implemented
- [ ] Rate limiting considered
- [ ] Logging implemented appropriately

### Database (if applicable)
- [ ] Migration scripts included
- [ ] Database changes are backward compatible
- [ ] Indexes properly added/updated
- [ ] Data validation rules implemented

---

## 📦 Dependencies

### New Dependencies Added
<!-- List any new dependencies and justify their inclusion -->
- Package: `package-name@version`
  - Purpose: 
  - Alternatives considered: 
  - Bundle size impact: 

### Dependencies Updated
<!-- List any updated dependencies -->
- Package: `package-name` from `old-version` to `new-version`
  - Reason for update: 
  - Breaking changes: 

---

## 🚀 Deployment Notes

### Environment Variables
<!-- List any new environment variables needed -->
- `ENV_VAR_NAME`: Description of what it does

### Configuration Changes
<!-- Any configuration file changes -->
- File: `config/file.json`
  - Changes: 

### Migration Requirements
<!-- Any database migrations or data migrations needed -->
- [ ] Database migration required
- [ ] Data migration required
- [ ] Manual steps required after deployment

### Rollback Plan
<!-- Describe how to rollback if issues arise -->
1. 
2. 
3. 

---

## 📝 Additional Notes

### Breaking Changes
<!-- Describe any breaking changes and migration path -->

### Performance Impact
<!-- Describe any performance implications -->

### Monitoring
<!-- Any new monitoring/alerting that should be set up -->

### Documentation Updates
<!-- List any documentation that needs to be updated -->
- [ ] API documentation
- [ ] User documentation
- [ ] Developer documentation
- [ ] README updates

---

## ✅ Final Checklist

### Before Requesting Review
- [ ] Branch is up to date with target branch
- [ ] All tests are passing locally
- [ ] Linting passes
- [ ] TypeScript compilation succeeds
- [ ] Bundle size is acceptable
- [ ] No merge conflicts

### Ready for Deployment
- [ ] Code has been reviewed and approved
- [ ] All CI/CD checks are passing
- [ ] Staging deployment tested
- [ ] Documentation updated
- [ ] Team has been notified of changes

---

## 👥 Reviewers

### Required Reviewers
<!-- Tag specific people who must review this PR -->
@devops-team @senior-developer

### Optional Reviewers
<!-- Tag people who might be interested -->
@frontend-team @backend-team

---

## 🏷️ Labels

<!-- This will be set automatically by GitHub Actions based on files changed -->
<!-- But you can add additional context labels -->

---

**Note to Reviewers:**
- Please test the feature/fix in your local environment if possible
- Check for any potential security implications
- Verify that the code follows our established patterns
- Consider the impact on performance and scalability

**Estimated Review Time:** <!-- e.g., 15 minutes, 1 hour, etc. -->

**Deployment Timeline:** <!-- When do you expect this to be deployed? -->

---

*This PR template helps ensure consistency and thoroughness in our code review process. Thank you for following these guidelines!*
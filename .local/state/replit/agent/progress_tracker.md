[x] 1. Install the required packages (cross-env installed successfully)
[x] 2. Restart the workflow to see if the project is working (workflow running successfully)
[x] 3. Verify the project is working using the feedback tool (screenshot confirmed login page displays correctly)
[x] 4. Inform user the import is completed and they can start building, mark the import as completed using the complete_project_import tool
[x] 5. Add "All Class Summary" feature to show prayer-wise absent students
[x] 6. Add PDF download functionality for All Class Summary
[x] 7. Move "All Class Summary" button next to main "Download PDF" button in header
[x] 8. Add prayer selection dialog - download specific prayer or all prayers
[x] 9. Add quick-download button on prayer dashboard (next to "Add Class") to download absent students for that specific prayer
[x] 10. Optimize application for INSTANT performance across all web interactions
[x] 11. Remove all artificial delays from Appwrite/Firebase sync
[x] 12. Make LocalStorage primary instant storage with background backend sync
[x] 13. Fix data integrity issues: await backend sync, handle errors properly
[x] 14. Optimize batch sizes: 10 for backend, 5 for Appwrite to balance speed and rate limits
[x] 15. Implement instant LocalStorage reads with background backend merging for multi-device support
[x] 16. Fix UI blocking: saveAttendanceBatch returns after LocalStorage write, backend syncs in background
[x] 17. Add optimistic updates: onSuccess fires after LocalStorage write for instant feedback
[x] 18. Fix online sync flow: LocalStorage is now primary storage, never cleared after sync
[x] 19. Complete instant performance optimization with data integrity maintained
[x] 20. Add PDF security: Create pdfSanitizer utility to remove malicious content
[x] 21. Sanitize all PDF user input: StudentReport, SummaryPage, ClassOverview
[x] 22. Remove control characters, PDF injection chars, limit field lengths in PDFs
[x] 23. Fix PDF "virus" issue: All user data now sanitized before PDF generation
[x] 24. Add admin panel with keyboard shortcut (786786 + Enter)
[x] 25. Implement user management, student/class/attendance management in admin panel
[x] 26. Add password hashing with bcrypt for security
[x] 27. Add admin role-based authorization middleware and frontend guards
[x] 28. Protect admin routes with requireAdmin middleware
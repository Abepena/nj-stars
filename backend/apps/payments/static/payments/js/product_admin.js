/**
 * Product Admin Customizations
 * Moves the ProductImage inline to appear right after the bulk upload section
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Find the bulk upload fieldset (contains "Upload Images" in the heading)
        const fieldsets = document.querySelectorAll('fieldset');
        let bulkUploadFieldset = null;

        fieldsets.forEach(function(fieldset) {
            const heading = fieldset.querySelector('h2');
            if (heading && heading.textContent.includes('Upload Images')) {
                bulkUploadFieldset = fieldset;
            }
        });

        // Find the ProductImage inline (first inline group)
        const imageInline = document.querySelector('.inline-group[id*="productimage"]') ||
                           document.querySelector('#productimage_set-group');

        // Move the inline right after the bulk upload fieldset
        if (bulkUploadFieldset && imageInline) {
            bulkUploadFieldset.parentNode.insertBefore(imageInline, bulkUploadFieldset.nextSibling);

            // Add a visual separator
            imageInline.style.marginTop = '0';
            imageInline.style.borderTop = 'none';
        }
    });
})();

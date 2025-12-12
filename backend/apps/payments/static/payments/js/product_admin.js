/**
 * Product Admin Customizations
 * Moves the ProductImage inline to appear right after the bulk upload section
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        console.log('[ProductAdmin] JS loaded');

        // Find the bulk upload fieldset (contains "Upload Images" in the heading)
        const fieldsets = document.querySelectorAll('fieldset');
        let bulkUploadFieldset = null;

        fieldsets.forEach(function(fieldset) {
            const heading = fieldset.querySelector('h2');
            if (heading && heading.textContent.includes('Upload Images')) {
                bulkUploadFieldset = fieldset;
                console.log('[ProductAdmin] Found bulk upload fieldset');
            }
        });

        // Find the ProductImage inline - try multiple selectors
        let imageInline = document.querySelector('#productimage_set-group') ||
                          document.querySelector('.inline-group[id*="productimage"]') ||
                          document.querySelector('[id$="-group"][id*="image"]:not([id*="legacy"])');

        // If still not found, look for first inline-group
        if (!imageInline) {
            const allInlines = document.querySelectorAll('.inline-group');
            console.log('[ProductAdmin] Found ' + allInlines.length + ' inline groups');
            allInlines.forEach(function(inline, i) {
                console.log('[ProductAdmin] Inline ' + i + ': ' + inline.id);
            });
            // First inline should be images
            if (allInlines.length > 0) {
                imageInline = allInlines[0];
            }
        }

        // Move the inline right after the bulk upload fieldset
        if (bulkUploadFieldset && imageInline) {
            console.log('[ProductAdmin] Moving inline: ' + imageInline.id);
            bulkUploadFieldset.parentNode.insertBefore(imageInline, bulkUploadFieldset.nextSibling);
            imageInline.style.marginTop = '0';
        } else {
            console.log('[ProductAdmin] Could not find elements - fieldset:', !!bulkUploadFieldset, 'inline:', !!imageInline);
        }
    });
})();

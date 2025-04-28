document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('scriptForm');
  const topicTextarea = document.getElementById('topic');
  const topicCharCount = document.getElementById('topicCharCount');
  const loading = document.getElementById('loading');
  const scriptResultContainer = document.getElementById('scriptResult');
  const scriptOutputHtmlElement = document.getElementById('scriptOutputHtml');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const exportDocsBtn = document.getElementById('exportDocsBtn');
  
  // Variable to store the raw script text
  let rawScriptText = '';

  // Character counter for topic textarea
  topicTextarea.addEventListener('input', function() {
    const count = this.value.length;
    topicCharCount.textContent = `${count} / ${this.maxLength}`;
    
    // Visual feedback (optional, can be adjusted)
    if (count > this.maxLength * 0.9) { // Example: color change near limit
      topicCharCount.style.color = 'var(--accent)';
    } else {
      topicCharCount.style.color = 'var(--gray-800)';
    }
  });
  
  // Add subtle visual feedback on form inputs (only topic now)
  topicTextarea.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
  });
  topicTextarea.addEventListener('blur', function() {
    this.parentElement.classList.remove('focused');
  });
  
  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const topic = topicTextarea.value.trim();
    
    if (!topic) {
      showNotification("Please enter the script topic.", "error");
      return;
    }
    
    // Reset state
    scriptResultContainer.style.display = 'none';
    scriptOutputHtmlElement.innerHTML = '';
    rawScriptText = '';
    copyBtn.style.display = 'none';
    exportDocsBtn.style.display = 'none';
    loading.style.display = 'flex';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic })
      });
      
      if (!res.ok) {
          let errorMsg = `Server responded with status: ${res.status}`;
          try {
              const errorData = await res.json();
              errorMsg = errorData.error || errorMsg;
          } catch (jsonError) {
              errorMsg = `${errorMsg} - ${res.statusText}`;
          }
          throw new Error(errorMsg);
      }

      const data = await res.json();
      
      if (data.error) {
        showNotification(data.error, "error");
        scriptOutputHtmlElement.innerHTML = `<p><strong>Error:</strong> ${data.error}</p>`;
        scriptResultContainer.style.display = 'block';
      } else if (data.script) {
        showNotification("Your script has been generated successfully!", "success");
        
        // Store raw script
        rawScriptText = data.script;
        
        // Parse Markdown and set as innerHTML
        // Ensure marked is loaded (check window.marked)
        if (window.marked) {
            scriptOutputHtmlElement.innerHTML = marked.parse(rawScriptText);
        } else {
            console.error("Marked.js library not loaded!");
            // Fallback to preformatted text if marked fails
            scriptOutputHtmlElement.innerHTML = `<pre>${rawScriptText}</pre>`; 
        }

        scriptResultContainer.style.display = 'block';
        copyBtn.style.display = 'inline-flex';
        exportDocsBtn.style.display = 'inline-flex';
      } else {
          throw new Error("Received success response but no script data.");
      }
    } catch (err) {
      console.error("Error generating script:", err);
      const errorText = err.message || "An unexpected error occurred.";
      showNotification(errorText, "error");
      scriptOutputHtmlElement.innerHTML = `<p><strong>Error:</strong> ${errorText}</p>`;
      scriptResultContainer.style.display = 'block';
    }
    
    // Reset button state
    loading.style.display = 'none';
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Script';
  });

  // Copy button functionality (copies RAW script text)
  copyBtn.addEventListener('click', function() {
      if (!rawScriptText) return; // Don't copy if no script
      navigator.clipboard.writeText(rawScriptText)
          .then(() => {
              showNotification('Raw script copied to clipboard!', 'success');
              copyBtn.textContent = 'Copied!';
              setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Raw Script'; }, 2000);
          })
          .catch(err => {
              console.error('Failed to copy text: ', err);
              showNotification('Failed to copy script.', 'error');
          });
  });

  // Export to Docs button functionality
  exportDocsBtn.addEventListener('click', function() {
      if (!scriptOutputHtmlElement.innerHTML) return; // Don't export if no content

      // Check if libraries are loaded
      if (typeof htmlDocx === 'undefined' || typeof saveAs === 'undefined') {
          console.error("html-to-docx or FileSaver library not loaded!");
          showNotification('Export libraries not loaded.', 'error');
          return;
      }

      try {
          // Add basic header/title to the HTML content for the DOCX
          const topicValue = topicTextarea.value.trim() || "Generated Script";
          const htmlContent = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <title>${topicValue}</title>
              </head>
              <body>
                  <h1>${topicValue}</h1>
                  ${scriptOutputHtmlElement.innerHTML}
              </body>
              </html>
          `;
          
          // Generate the blob
          const fileBuffer = htmlDocx.asBlob(htmlContent);
          
          // Trigger the download using FileSaver.js
          // Sanitize topic for filename
          const filename = topicValue.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.docx';
          saveAs(fileBuffer, filename);

          showNotification('Exporting script to DOCX...', 'success');

      } catch (err) {
          console.error("Error exporting to DOCX:", err);
          showNotification('Failed to export script to DOCX.', 'error');
      }
  });
  
  // Helper function for notifications (Ensure it uses the correct IDs from index.html)
  function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (!notification || !notificationIcon || !notificationMessage) {
        console.error("Notification elements not found!");
        return;
    }

    // Remove previous type classes
    notification.classList.remove('success', 'error');
    
    // Add current type class
    notification.classList.add(type);
    notificationIcon.className = `fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`; // Set icon class
    notificationMessage.textContent = message;
    
    // Show with animation
    notification.classList.add('show');
    
    // Auto hide after 5 seconds
    // Clear previous timeout if exists
    if (notification.hideTimeout) {
      clearTimeout(notification.hideTimeout);
    }
    notification.hideTimeout = setTimeout(() => {
      hideNotification();
    }, 5000);
  }
  
  // Global hide function needed for the button's onclick attribute
  window.hideNotification = function() { 
    const notification = document.getElementById('notification');
    if (notification) {
      if (notification.hideTimeout) {
          clearTimeout(notification.hideTimeout);
          notification.hideTimeout = null;
      }
      notification.classList.remove('show');
      // Note: We don't remove the element, just hide it, as it's hardcoded in HTML
    }
  }
});
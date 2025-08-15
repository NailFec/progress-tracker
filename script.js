// Task Progress Tracker - Main JavaScript File

// Store tasks in localStorage for persistence
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentEditingTaskId = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    renderTasks();
    initializeSortable();
    console.log('Task Progress Tracker initialized');
});

/**
 * Initialize SortableJS for drag-and-drop functionality
 */
function initializeSortable() {
    const container = document.getElementById('tasksContainer');
    new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: function(evt) {
            const reorderedTasks = [];
            const taskCards = container.querySelectorAll('.task-card');
            
            taskCards.forEach(card => {
                const taskId = parseInt(card.id.replace('task-', ''));
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    reorderedTasks.push(task);
                }
            });
            
            tasks = reorderedTasks;
            saveTasks();
        }
    });
}

/**
 * Open the add task modal
 */
function openAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    modal.classList.add('show');
    document.getElementById('taskName').focus();
}

/**
 * Close the add task modal
 */
function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    modal.classList.add('hide');
    
    // Wait for animation to finish before hiding
    modal.addEventListener('animationend', function() {
        modal.classList.remove('show');
        modal.classList.remove('hide');
        
        // Clear form fields
        document.getElementById('taskName').value = '';
        document.getElementById('taskTarget').value = '';
    }, { once: true });
}

/**
 * Open the edit task modal with the current task data
 * @param {number} taskId - The ID of the task to edit
 */
function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        currentEditingTaskId = taskId;
        document.getElementById('editTaskName').value = task.name;
        document.getElementById('editTaskCurrent').value = task.current;
        document.getElementById('editTaskTarget').value = task.target;
        
        const modal = document.getElementById('editTaskModal');
        modal.classList.add('show');
    }
}

/**
 * Close the edit task modal
 */
function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    modal.classList.remove('show');
}

/**
 * Update task details after editing
 */
function updateTask() {
    if (currentEditingTaskId === null) return;

    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (task) {
        const newName = document.getElementById('editTaskName').value.trim();
        const newCurrent = parseInt(document.getElementById('editTaskCurrent').value);
        const newTarget = parseInt(document.getElementById('editTaskTarget').value);

        if (!newName || isNaN(newCurrent) || isNaN(newTarget) || newTarget < 1 || newCurrent < 0 || newCurrent > newTarget) {
            alert('Please enter valid data. Target must be at least 1, and current progress must be between 0 and the target.');
            return;
        }

        task.name = newName;
        task.current = newCurrent;
        task.target = newTarget;
        task.lastModified = new Date().toISOString();

        saveTasks();
        renderTasks();
        closeEditTaskModal();
    }
}

/**
 * Add a new task to the list
 */
function addTask() {
    const taskName = document.getElementById('taskName').value.trim();
    const taskTarget = parseInt(document.getElementById('taskTarget').value);

    // Validate input
    if (!taskName || !taskTarget || taskTarget < 1) {
        alert('Please enter a valid task name and target value (minimum 1)');
        return;
    }

    // Create new task object
    const newTask = {
        id: Date.now(),
        name: taskName,
        target: taskTarget,
        current: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };

    // Add to tasks array
    tasks.push(newTask);
    
    // Save to localStorage
    saveTasks();
    
    // Re-render tasks
    renderTasks();
    
    // Close modal and clear form
    closeAddTaskModal();
    
    console.log('Task added:', newTask);
}

/**
 * Update task progress by incrementing or decrementing
 * @param {number} taskId - The ID of the task to update
 * @param {number} change - The amount to change (+1 or -1)
 */
function updateProgress(taskId, change) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newValue = task.current + change;
        // Ensure value doesn't go below 0 or above target
        task.current = Math.max(0, Math.min(newValue, task.target));
        task.lastModified = new Date().toISOString();
        
        saveTasks();
        
        // Update only the specific task in the DOM
        const taskCard = document.getElementById(`task-${taskId}`);
        if (taskCard) {
            const progressFill = taskCard.querySelector('.progress-fill');
            const progressText = taskCard.querySelector('.progress-text');
            
            if (progressFill) {
                progressFill.style.width = `${(task.current / task.target) * 100}%`;
            }
            if (progressText) {
                progressText.textContent = `(${task.current} / ${task.target})`;
            }
        }
        
        console.log(`Task ${task.name} progress updated: ${task.current}/${task.target}`);
    }
}

/**
 * Delete a task from the list
 * @param {number} taskId - The ID of the task to delete
 */
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const deletedTask = tasks[taskIndex];
            tasks.splice(taskIndex, 1);
            saveTasks();
            renderTasks();
            console.log('Task deleted:', deletedTask);
        }
    }
}

/**
 * Save tasks to localStorage with error handling
 */
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('Tasks saved to localStorage successfully');
    } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
        alert('Warning: Unable to save tasks. Data may be lost.');
    }
}

/**
 * Load tasks from localStorage with error handling
 */
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            console.log('Tasks loaded from localStorage successfully');
        }
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        tasks = [];
        alert('Error loading saved tasks. Starting with empty task list.');
    }
}

/**
 * Export all tasks data to a JSON file
 */
function exportData() {
    try {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `task-progress-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        console.log('Data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}

/**
 * Import tasks data from a JSON file
 */
function importData() {
    document.getElementById('importFile').click();
}

/**
 * Handle file import when user selects a file
 * @param {Event} event - The file input change event
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (Array.isArray(importedTasks) && importedTasks.length > 0) {
                const isValid = importedTasks.every(task => 
                    task.id && task.name && typeof task.target === 'number' && typeof task.current === 'number'
                );
                
                if (isValid) {
                    if (confirm(`Import ${importedTasks.length} tasks? This will replace your current tasks.`)) {
                        tasks = importedTasks;
                        saveTasks();
                        renderTasks();
                        alert(`Successfully imported ${importedTasks.length} tasks!`);
                        console.log('Data imported successfully:', importedTasks);
                    }
                } else {
                    alert('Invalid data format. Please check your import file.');
                }
            } else {
                alert('No valid tasks found in the import file.');
            }
        } catch (error) {
            console.error('Error parsing import file:', error);
            alert('Error reading import file. Please check the file format.');
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

/**
 * Clear all tasks and data
 */
function clearAllData() {
    if (confirm('Are you sure you want to clear ALL tasks? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your tasks. Are you absolutely sure?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            alert('All tasks have been cleared.');
            console.log('All tasks cleared');
        }
    }
}

/**
 * Render all tasks on the page
 */
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');

    if (tasks.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    container.innerHTML = tasks.map(task => `
        <div class="task-card" id="task-${task.id}">
            <div class="task-header">
                <div>
                    <div class="task-title">${escapeHtml(task.name)}
                        <div class="controls">
                            <button class="control-btn" onclick="updateProgress(${task.id}, -1)"><i class="fas fa-minus"></i></button>
                            <button class="control-btn" onclick="updateProgress(${task.id}, 1)"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="task-target">Target: ${task.target} <span class="progress-text">(${task.current} / ${task.target})</span></div>
                </div>
                <div class="task-buttons">
                    <button class="edit-btn" onclick="openEditTaskModal(${task.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            
            <div class="progress-section">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(task.current / task.target) * 100}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Auto-save tasks periodically (every 30 seconds)
 */
setInterval(function() {
    if (tasks.length > 0) {
        saveTasks();
    }
}, 30000);

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement.id === 'taskName') {
        document.getElementById('taskTarget').focus();
    } else if (e.key === 'Enter' && document.activeElement.id === 'taskTarget') {
        addTask();
    } else if (e.key === 'Escape') {
        closeAddTaskModal();
    }
});

// Add window beforeunload event to ensure data is saved
window.addEventListener('beforeunload', function() {
    if (tasks.length > 0) {
        saveTasks();
    }
});

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('addTaskModal');
    if (event.target === modal) {
        closeAddTaskModal();
    }
    const editModal = document.getElementById('editTaskModal');
    if (event.target === editModal) {
        closeEditTaskModal();
    }
});

// Load tasks on page load
loadTasks();

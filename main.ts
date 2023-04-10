import { Plugin } from 'obsidian';

export default class TodoPlugin extends Plugin {
  async onload() {
    console.log('Loading Todo Plugin');

    await this.updateTodoFile();

    // Register an event listener for when a file is saved
    this.registerEvent(
      this.app.vault.on('modify', async (file) => {

        if (file.path === 'todo.txt') {
          // Do not trigger if todo.txt is modified
          return;
        }

        // Check if modified file has #todo tag
        if ((await this.app.vault.read(file)).includes('#todo')) {
          await this.updateTodoFile();
        }
      })
    );

    // Register an event listener for when a file is deleted
    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        // Check if deleted file has #todo tag
        if (file.path.includes('#todo')) {
          await this.updateTodoFile();
        }
      })
    );

    // Register an event listener for when a new file is created
    this.registerEvent(
      this.app.vault.on('create', async (file) => {
        // Check if created file has #todo tag
        if ((await this.app.vault.read(file)).includes('#todo')) {
          await this.updateTodoFile();
        }
      })
    );

  }


  async updateTodoFile() {
    // Get all the Markdown notes in the vault
    const markdownFiles = this.getMarkdownFiles();

    // Filter out notes that do not have the #todo tag
    const todoNotes = markdownFiles.filter(async (note) => {
      const content = await this.app.vault.read(note);
      return content.includes('#todo');
    });

    const filteredTodoNotes = todoNotes.filter((note) => note !== undefined);

    // Get the todo items from each note with #todo tag
    const todoItems = filteredTodoNotes.map(async (note) => {
      const items = (await this.app.vault.read(note))
        ?.split('\n')
        .filter((line) => (line.includes('- [ ]') || line.includes('- [x]')) && line.includes('#todo'))
        .map((line) => {
          // Replace Obsidian Tasks notations to todo.txt due date
          line = line.replaceAll('/📅\s?/', 'due:');

          // Replace Obsidian Tasks recurrence notation to todo.txt recurrence
          line = line.replaceAll('🔁 every day', 'rec:1d')
            .replaceAll('🔁 every week', 'rec:1w')
            .replaceAll('🔁 every month', 'rec:1m');

          // Replace Obsidian Tasks notations to todo.txt priority notation
          const priorityRegex = /[\u{23EB}\u{1F53A}\u{1F53D}]/gu; // use 'g' flag to match all occurrences
          const matches = [...line.matchAll(priorityRegex)];
          let priority = '';
          matches.forEach((match) => {
            const priorityChar = match[0];
            if (priorityChar === '\u{23EB}') {
              priority = '(A)';
            } else if (priorityChar === '\u{1F53A}') {
              priority = '(B)';
            } else if (priorityChar === '\u{1F53D}') {
              priority = '(C)';
            }
            line = line.replace(priorityChar, '');
          });

          // Append the priority notation to the beginning of the line
          if (priority) {
            line = `${priority} ${line}`;
          }


          // Replace ticked off items with x
          line = line.replace('- [x] ', 'x ');

          // Remove the checkbox and any tags from the line
          line = line.replace('- [ ]', '').replace('#todo', '');

          return line.trim();
        }) || [];

      return items;
    });

    // Wait for all promises to resolve before continuing
    const allItems = await Promise.all(todoItems);

    // Update the todo.txt file with the latest todo items
    await this.app.vault.adapter.write(
      'todo.txt',
      allItems.flat().join('\n') + '\n'
    );

    console.log('Updated todo.txt file');
  }

  getMarkdownFiles() {
    const { vault } = this.app;
    return vault.getMarkdownFiles();
  }
}

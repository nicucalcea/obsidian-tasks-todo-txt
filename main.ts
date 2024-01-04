import { Plugin } from 'obsidian';

export default class TodoPlugin extends Plugin {
  async onload() {
    console.log('Loading Todo Plugin');

    await this.updateTodoFile();

    // Function to check if a line contains a todo or a calendar emoji
    function containsTodo(line: string): boolean {
      return line.includes('#todo') || line.includes('📅');
    }

    // Register an event listener for when a file is saved
    this.registerEvent(
      this.app.vault.on('modify', async (file) => {

        if (file.path === 'todo.txt') {
          // Do not trigger if todo.txt is modified
          return;
        }

        // Read the file
        const fileContent = await this.app.vault.read(file);

        // Check if the file content has #todo tag or 📅 symbol
        if (containsTodo(fileContent)) {
          await this.updateTodoFile();
        }

      })
    );

    // Register an event listener for when a file is deleted
    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        // Check if deleted file has #todo tag
        if (containsTodo(file.path)) {
          await this.updateTodoFile();
        }
      })
    );

    // Register an event listener for when a new file is created
    this.registerEvent(
      this.app.vault.on('create', async (file) => {
        // Check if created file has #todo tag
        if (containsTodo(await this.app.vault.read(file))) {
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
      return containsTodo(content);
    });

    const filteredTodoNotes = todoNotes.filter((note) => note !== undefined);

    // Get the todo items from each note with #todo tag
    const todoItems = filteredTodoNotes.map(async (note) => {
      const items = (await this.app.vault.read(note))
        ?.split('\n')
        .filter((line) => (line.includes('- [ ]') || line.includes('- [x]') || line.includes('- [/]')) && (line.includes('#todo') || line.includes('📅')))
        .map((line) => {
          // Replace Obsidian Tasks notations to todo.txt due date
          line = line.replace('📅 ', 'due:');
          line = line.replace('📅', 'due:');

          // Replace Obsidian Tasks recurrence notation to todo.txt recurrence
          line = line.replace('🔁 every day', 'rec:1d');
          line = line.replace('🔁 every two days', 'rec:2d');
          line = line.replace(/🔁 every (\d+) day(s)?/gi, 'rec:$1d'); // e.g. every n days
          line = line.replace('🔁 every week', 'rec:1w');
          line = line.replace(/🔁 every (\d+) week(s)?/gi, 'rec:$1w'); // e.g. every n weeks
          line = line.replace('🔁 every month', 'rec:1m');
          line = line.replace(/🔁 every (\d+) month(s)?/gi, 'rec:$1m'); // e.g. every n months

          // Replace Obsidian Tasks notations to todo.txt priority notation
          const priorityRegex = /[\u{1F53A}\u{23EB}\u{1F53C}\u{1F53D}]/gu; // use 'g' flag to match all occurrences
          const matches = [...line.matchAll(priorityRegex)];
          let priority = '';
          matches.forEach((match) => {
            const priorityChar = match[0];
            if (priorityChar === '\u{1F53A}') {
              priority = '(A)';
            } else if (priorityChar === '\u{23EB}') {
              priority = '(B)';
            } else if (priorityChar === '\u{1F53C}') {
              priority = '(C)';
            } else if (priorityChar === '\u{1F53D}') {
              priority = '(D)';
            }
            line = line.replace(priorityChar, '');
          });

          // Append the priority notation to the beginning of the line
          if (priority) {
            line = `${priority} ${line}`;
          }

          // Replace ticked off items with x and append to beginning of line
          line = line.includes('- [x] ') ? `x ${line.replace('- [x] ', '')}` : line;
          // line = line.includes('- [a] ') ? `a ${line.replace('- [a] ', '')}` : line;

          // Remove the checkbox and any tags from the line
          line = line.replace('- [ ]', '').replace('- [/]', '').replace('#todo', '');

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

    // console.log('Updated todo.txt file');
  }

  getMarkdownFiles() {
    const { vault } = this.app;
    return vault.getMarkdownFiles();
  }
}

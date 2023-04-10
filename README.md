# Obsidian Tasks to todo.txt

This is a simple plugin that will monitor your notes for checklist items tagged with `#todo` and save them to a todo.txt file in the root of your Vault.

It also parses some of the [Obsidian Tasks](https://obsidian-tasks-group.github.io/obsidian-tasks/) notation for due dates and priority to the [todo.txt](http://todotxt.org/) standard.

My use case is to receive notifications for my upcomning tasks on my phone. The way that works:
- I add a task in Obsidian, give it a due date (Obsidian Tasks style) and a `#todo` tag.
- This plugin automatically creates and updates a `todo.txt` in the root of my vault.
- I sync that vault with my phone via Syncthing.
- I then point [Todo.txt for Android](https://play.google.com/store/apps/details?id=net.c306.ttsuper) or [Simpletask](https://f-droid.org/packages/nl.mpcjanssen.simpletask/) to the todo.txt file.
- My phone sends me notifications for upcoming tasks.

Note that this is a one-way process. Changes in Obsidian will overwrite the `todo.txt` file, but changes to `todo.txt` will not be reflected in Obsidian.
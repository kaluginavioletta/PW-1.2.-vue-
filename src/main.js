const storageKey = 'new'; // Убедитесь, что ключ соответствует вашему хранилищу

const storageData = localStorage.getItem(storageKey);

const initialData = storageData ? JSON.parse(storageData) : {
    nullNotes: [],
    halfNotes: [],
    doneNotes: [],
};

new Vue({
    el: '#app',
    data() {
        return {
            newNote: {
                title: '',
            },
            newList: [
                { title: '' },
            ],     
            nullNotes: initialData.nullNotes,
            halfNotes: initialData.halfNotes,
            doneNotes: initialData.doneNotes,
            editedNote: null,
            editedNoteIndex: null,
            editedColumn: null,
            showForm: false,
        }
    },
    methods: {
        // saveData() {
        //     localStorage.setItem('nullNotes', JSON.stringify(this.nullNotes));
        //     localStorage.setItem('halfNotes', JSON.stringify(this.halfNotes));
        //     localStorage.setItem('doneNotes', JSON.stringify(this.doneNotes));
        // },
        // loadData() {
        //     this.nullNotes = JSON.parse(localStorage.getItem('nullNotes')) || [];
        //     this.halfNotes = JSON.parse(localStorage.getItem('halfNotes')) || [];
        //     this.doneNotes = JSON.parse(localStorage.getItem('doneNotes')) || [];
        // },
        addNote() {
            const doneListItems = this.newList.map(() => false);
            this.nullNotes.push({
                ...this.newNote,
                lists: this.newList,
                doneListItems,
                createdAt: new Date().toLocaleString(),
                lastChange: null
            });
            this.newNote = {
                title: '',
            };
            this.newList = [
                { title: '' }
            ];
        },
        toggleForm() {
            this.showForm = !this.showForm;
        },
        addList() {
            if (this.newList.length < 5) {
                this.newList.push({ title: '' });
            } else {
                alert('Больше 5 списков нельзя!');
            }
        },
        addToNullNotes() {
            if (!this.newNote.title) {
                alert('Необходимо указать заголовок заметки');
                return;
            }
            if (!this.newNote.title || this.newList.some(listItem => !listItem.title)) {
                alert('Поля для списков не должны быть пустыми');
                return;
            }
            if (this.newList.length < 3 || this.newList.length > 5) {
                alert('Количество списков должно быть в диапазоне от 3 до 5');
                return;
            }
            if (this.nullNotes.length >= 3) {
                alert('Нельзя добавить более 3-х заметок в первый столбец');
                return;
            }
            if (this.halfNotes.length >= 5) {
                alert('Нельзя добавить более 5-ти заметок во второй столбец');
                return;
            }
            if (this.newNote.title && this.newList.length >= 3 && this.newList.every(listItem => listItem.title)) {
                const newNoteData = {
                    title: this.newNote.title,
                    lists: this.newList.map(listItem => ({ title: listItem.title, done: false })),
                    doneListItems: this.newList.map(() => false),
                    createdAt: new Date().toLocaleString(),
                    lastChange: null
                };
                this.nullNotes.push(newNoteData);
                this.newNote = { title: '' };
                this.newList = [{ title: '' }];
            }
        },
        autoMoveNote(noteIndex, column) {
            let note;
            if (column === 'nullNotes') {
                note = this.nullNotesWithDoneCount[noteIndex];
            } else if (column === 'halfNotes') {
                note = this.halfNotesWithDoneCount[noteIndex];
            } else {
                return;
            }
    
            if (!note) {
                return;
            }
    
            const percentageDone = (note.doneListItemsCount / note.lists.length) * 100;
    
            if (percentageDone === 100) {
                if (column === 'nullNotes') {
                    this.doneNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
                    note.lastDoneAt = new Date().toLocaleString();
                } else {
                    this.doneNotes.push(this.halfNotes.splice(noteIndex, 1)[0]);
                    note.lastDoneAt = new Date().toLocaleString();
                }
            } else if (percentageDone >= 50 && column === 'nullNotes') {
                this.halfNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
                note.lastDoneAt = null;
            } else if (percentageDone < 50) {
                if (column === 'halfNotes') {
                    this.nullNotes.push(this.halfNotes.splice(noteIndex, 1)[0]);
                    note.lastDoneAt = null;
                }
            }
    
            this.saveData();
        },
    },
    computed: {
        nullNotesWithDoneCount() {
            return this.nullNotes.map((note, index) => {
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                return { ...note, doneListItemsCount };
            });
        },
        halfNotesWithDoneCount() {
            return this.halfNotes.map((note, index) => {
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                return { ...note, doneListItemsCount };
            });
        }
    },
    watch: {
        nullNotesWatcher: {
            deep: true,
            handler(newVal, oldVal) {
                newVal.forEach((count, index) => {
                    this.autoMoveNote(index, 'nullNotes');
                });
            }
        },
        handler(newVal, oldVal) {
            newVal.forEach((count, index) => {
              this.autoMoveNote(index, 'halfNotes');
            });
        },
        nullNotes: {
            handler(newNullNotes) {
                this.saveData();
            },
            deep: true
        },
        halfNotes: {
            handler(newhalfNotes) {
                this.saveData();
            },
            deep: true
        },
        doneNotes: {
            handler(doneNotes) {
                this.saveData();
            },
            deep: true
        }
    },
});
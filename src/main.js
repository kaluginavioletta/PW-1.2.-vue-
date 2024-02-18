const storageKey = 'new'; // Убедитесь, что ключ соответствует вашему хранилищу

const storageData = localStorage.getItem(storageKey);

const initialData = storageData ? JSON.parse(storageData) : {
    nullNotes: [],
    halfNotes: [],
    doneNotes: [],
};

initialData.doneNotes = initialData.doneNotes.map(note => ({ ...note, lastDoneAt: null }));

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
            isColumnBlocked: false,
            doneNotesWithLastDoneAt: [],
            halfNotesBlocked: false,
        }
    },
    created() {
        this.loadData();
        this.$nextTick(() => {
            this.blockFirstColumn();
        });
    },
    methods: {
        blockFirstColumn() {
            const halfNotesWithMoreThan50Percent = this.nullNotes.some(note => (note.doneListItems.length / note.lists.length) * 100 > 50);
            const halfNotesWithoutFullyDone = !this.halfNotes.some(note => note.doneListItems.length === note.lists.length);
          
            if (this.halfNotes.length === 5 && halfNotesWithMoreThan50Percent && halfNotesWithoutFullyDone) {
              this.isColumnBlocked = true;
            } else {
              this.isColumnBlocked = false;
            }
        },
        blockHalfNotesColumn() {
            if (this.halfNotes.length >= 5 && !this.doneNotes.length) {
                this.halfNotesBlocked = true;
            }
        },
        loadData() {
            this.nullNotes = JSON.parse(localStorage.getItem(`${storageKey}NullNotes`)) || [];
            this.halfNotes = JSON.parse(localStorage.getItem(`${storageKey}HalfNotes`)) || [];
            this.doneNotes = JSON.parse(localStorage.getItem(`${storageKey}DoneNotes`)) || [];
        },
        saveData() {
            localStorage.setItem(`${storageKey}NullNotes`, JSON.stringify(this.nullNotes));
            localStorage.setItem(`${storageKey}HalfNotes`, JSON.stringify(this.halfNotes));
            localStorage.setItem(`${storageKey}DoneNotes`, JSON.stringify(this.doneNotes));
            this.checkDoneNotes();
        },
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
            const anyNullNoteOver50Percent = this.nullNotes.some(note => {
              const percentageDone = (note.doneListItems.filter(item => item).length / note.lists.length) * 100;
              return percentageDone > 50;
            });
          
            if (anyNullNoteOver50Percent) {
              this.nullNotesBlocked = true;
            }
          
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
          
            if (this.newNote.title && this.newList.length >= 3 && this.newList.every(listItem => listItem.title)) {
              const newNoteData = {
                title: this.newNote.title,
                lists: this.newList.map(listItem => ({ title: listItem.title, done: false })),
                doneListItems: this.newList.map(listItem => listItem.done),
                createdAt: new Date().toLocaleString(),
                lastChange: null,
                lastDoneAt: null // Add this line
              };
              this.nullNotes.push(newNoteData);
              this.newNote = { title: '' };
              this.newList = [{ title: '', done: false }];
            }
        },
        autoMoveNote(noteIndex, column) {
            let note;
            if (column === 'nullNotes') {
              note = this.nullNotesWithDoneCount[noteIndex];
              const percentageDone = (note.doneListItems.filter(Boolean).length / note.lists.length) * 100;
          
              if (percentageDone > 50) {
                const doneNote = { ...note };
                doneNote.lastDoneAt = new Date().toLocaleString(); // Add this line
                this.halfNotes.push(doneNote);
                this.nullNotes.splice(noteIndex, 1);
              }
            } else if (column === 'halfNotes') {
              note = this.halfNotesWithDoneCount[noteIndex];
              const percentageDone = (note.doneListItems.filter(Boolean).length / note.lists.length) * 100;
          
              if (percentageDone === 100) {
                const doneNote = { ...note };
                doneNote.lastDoneAt = new Date().toLocaleString(); // Add this line
                this.doneNotes.push(doneNote);
                this.halfNotes.splice(noteIndex, 1);
                this.isColumnBlocked = false;
              }
            } else if (column === 'doneNotes') {
              note = this.doneNotes[noteIndex];
              this.isColumnBlocked = false;
            } else {
              return;
            }
          
            this.blockFirstColumn();
            this.checkDoneNotes();
            this.saveData();
        },        
        moveAndBlock() {
            if (this.doneNotesWithLastDoneAt.length >= 1) {
                this.isColumnBlocked = true;
                // блокируем редактирование первого столбца
                this.editedNote = null;
                this.editedNoteIndex = null;
                this.editedColumn = null;
            }
        },
        checkDoneNotes() {
            const doneNote = this.doneNotes.find(note => note.doneListItems.filter(Boolean).length === note.lists.length);
            if (doneNote) {
              this.doneNotesWithLastDoneAt.push(doneNote);
              this.doneNotes = this.doneNotes.filter(note => note !== doneNote);
              this.moveAndBlock();
            }
        },     
        unlockColumn() {
            this.isColumnBlocked = false;
            // разблокируйте редактирование первого столбца
        },    
        autoMoveNoteAndBlock(index, column) {
            const targetColumn = column === 'halfNotes' ? 'doneNotes' : 'halfNotes';
            const completedPercentage = column === 'nullNotes' ? 50 : 100;
        
            if (this[targetColumn].length >= 5 && this.nullNotes.some(note => note.percentageDone >= completedPercentage)) {
                this.isColumnBlocked = true;
                this.editedNote = null;
                this.editedNoteIndex = null;
                this.editedColumn = null;
            } else {
                this.autoMoveNote(index, column, completedPercentage);
        
                // проверяем, все ли задачи в столбце отмечены как выполненные
                const allNotesDone = this[column].every(note => note.percentageDone === 100);
                if (allNotesDone) {
                    this.unlockColumn();
                }
            }
        },
    },
    computed: {
        nullNotesWithDoneCount() {
            return this.nullNotes.map((note, index) => {
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                return { ...note, doneListItemsCount, index };
            });
        },
        halfNotesWithDoneCount() {
            return this.halfNotes.map((note, index) => {
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                return { ...note, doneListItemsCount, index };
            });
        },
        doneHalfNotesCount() {
            return this.halfNotes.filter(note => {
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                const totalListItemsCount = note.lists.length;
                const percentageDone = (doneListItemsCount / totalListItemsCount) * 100;
                return percentageDone === 100;
            }).length;
        }, 
        doneNotesWithLastDoneAt() {
            return this.doneNotes.map(note => {
              if (note.doneListItems.filter(Boolean).length === note.lists.length) {
                return { ...note, lastDoneAt: new Date().toLocaleString() };
              }
              return note;
            });
        },
    },


    watch: {
        'nullNotesWithDoneCount.length': {
            handler() {
                this.blockFirstColumn();
            }
        },
        'nullNotesWithDoneCount.1': {
            handler(newVal, oldVal) {
              if (newVal.percentageDone === 100) {
                const doneNote = { ...this.nullNotesWithDoneCount[1], lastDoneAt: new Date().toLocaleString() };
                this.doneNotes.push(doneNote);
                this.halfNotes.splice(1, 1);
                this.isColumnBlocked = false;
              }
            },
            deep: true
        },
        'halfNotesWithDoneCount.length': {
            handler() {
                this.blockHalfNotesColumn();
            }
        },
        'halfNotesWithDoneCount.4': {
            handler(newVal, oldVal) {
                if (newVal.percentageDone === 100) {
                    this.autoMoveNote(0, 'doneNotes');
                }
            },
            deep: true
        },
        nullNotes: {
            handler(newPlannedTasks) {
                this.saveData();
            },
            deep: true
        },
        halfNotes: {
            handler(newProgressTasks) {
                this.saveData();
            },
            deep: true
        },
        doneHalfNotesCount: {
            handler(newCount) {
                if (newCount > 0 && this.isColumnBlocked) {
                    this.unlockColumn();
                }
            },
            immediate: true
        }
    },
},);
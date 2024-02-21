const storageKey = 'new'; // Убедитесь, что ключ соответствует вашему хранилищу

const storageData = localStorage.getItem(storageKey);

const initialData = storageData ? JSON.parse(storageData) : {
    nullNotes: [],
    halfNotes: [],
    doneNotes: [],
};

function getUniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

initialData.doneNotes = initialData.doneNotes.map(note => ({ ...note, lastDoneAt: null }));

new Vue({
    el: '#app',
    data() {
        return {
            newNote: {
                title: '',
            },
            newList: [
                { title: '', id: getUniqueId('newListItem') },
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
            // halfNotesBlocked: false,
        }
    },
    beforeMount() {
        this.loadData();
        this.saveData(); // save initial data
        this.$nextTick(() => {
          this.blockFirstColumn();
        });
    },
    created() {
        this.loadData();
        this.saveData(); // save initial data
        this.$nextTick(() => {
          this.blockFirstColumn();
        });
    },
    methods: {
        doneCheck(noteIndex, column) {
            if (column === 'nullNotes') {
              let note = this.nullNotes[noteIndex];
              this.doneNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
              note.lastDoneAt = new Date().toLocaleString();
              note.doneListItems = note.doneListItems.map(item => true); // Устанавливаем все чекбоксы в true
            } else if (column === 'halfNotes') {
              let note = this.halfNotes[noteIndex];
              this.doneNotes.push(this.halfNotes.splice(noteIndex, 1)[0]);
              note.lastDoneAt = new Date().toLocaleString();
              note.doneListItems = note.doneListItems.map(item => true); // Устанавливаем все чекбоксы в true
              this.isColumnBlocked = false;
            }
        },                      
        blockFirstColumn() {
            const halfNotesWithMoreThan50Percent = this.nullNotes.some(note => (note.doneListItems.length / note.lists.length) * 100 > 50);
            if (!this.halfNotes || !this.nullNotes) {
                return;
            }
            if (this.halfNotes.length === 5 && halfNotesWithMoreThan50Percent) {
                // If the second column has reached its maximum capacity and has a card with more than 50% completion, move the first card from the first column that has more than 50% completion to the second column
                const eligibleNote = this.nullNotes.find(note => (note.doneListItems.length / note.lists.length) * 100 > 50);
                if (eligibleNote) {
                    this.halfNotes.push(this.nullNotes.splice(this.nullNotes.indexOf(eligibleNote), 1)[0]);
                    this.editedTask = null;
                    this.editedTaskIndex = null;
                    this.editedColumn = null;
                }
            } else {
                this.isColumnBlocked = this.halfNotes.length === 5 && halfNotesWithMoreThan50Percent;
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
            if (!this.newNote.title.trim()) {
                alert('Необходимо указать заголовок заметки');
                return;
            }            
        
            if (this.newList.some(listItem => !listItem.title)) {
                alert('Поля для списков не должны быть пустыми');
                return;
            }
        
            if (this.newList.length !== 3 && this.newList.length !== 4 && this.newList.length !== 5) {
                alert('Количество списков должно быть ровно 3, 4 или 5');
                return;
            }
        
            if (this.nullNotes.length >= 3) {
                alert('Нельзя добавить более 3-х заметок в первый столбец');
                return;
            }
        
            const newNoteData = {
                title: this.newNote.title,
                lists: this.newList.map(listItem => ({ title: listItem.title, done: false })),
                doneListItems: this.newList.map(() => false),
                createdAt: new Date().toLocaleString(),
                lastChange: null
            };
        
            this.nullNotes.push(newNoteData);
            this.newNote = { title: '' };
            this.newList.forEach((listItem) => {
                listItem.title = '';
            });
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
        autoMoveNote(noteIndex, column) {
            if (this.isColumnBlocked && column === 'nulled') {
                return;
            }
            const note = column === 'nulled' ? this.nullNotes[noteIndex] : this.halfNotes[noteIndex];
            if (note === undefined) {
                return;
            }
            const DoneListItemsCount = note.doneListItems.filter(Boolean).length;
            const totalListItemsCount = note.lists.length;
            const percentageDone = (DoneListItemsCount / totalListItemsCount) * 100;
            if (percentageDone === 100) {
                if (column === 'nullNotes') {
                    this.doneNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
                    note.lastDoneAt = new Date().toLocaleString();
                } else {
                    this.doneNotes.push(this.halfNotes.splice(noteIndex, 1)[0]);
                    note.lastDoneAt = new Date().toLocaleString();
                }
                // Reset isColumnBlocked when a card in the second column moves to the third column
                if (column === 'halfNotes') {
                    this.isColumnBlocked = false;
                }
            } 
            else if (percentageDone >= 50) {
                if (column === 'nulled') {
                    if (this.halfNotes.length >= 5) {
                        alert('Нельзя добавить более 5-ти карточек во второй столбец');
                        // Блокируем редактирование первого столбца
                        this.editedTask = null;
                        this.editedTaskIndex = null;
                        this.editedColumn = null;
                        this.isColumnBlocked = true;
                    } else {
                        // помощь!
                        this.halfNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
                        // Проверяем, если удаляется карточка из первого столбца и он содержит задачи с процентом выполнения >= 50
                        if (this.nullNotes.some(note => note.percentageDone >= 50)) {
                            this.halfNotes.unshift(this.nullNotes.shift()); // Переносим первую задачу из первого столбца во второй
                            // Блокируем редактирование первого столбца
                            this.editedTask = null;
                            this.editedTaskIndex = null;
                            this.editedColumn = null;
                        }
                        this.moveNoteToSecondColumn(noteIndex); // Перемещаем карточку во второй столбец после успешного добавления
                    }
                }
            }            


            else if (percentageDone < 50) {
                if (column === 'halfNotes') {
                    if (this.nullNotes.length < 3) {
                        this.nullNotes.push(this.halfNotes.splice(noteIndex, 1)[0]);
                    }
                    else {
                        alert("В 1 столбце уже есть 3 карточки");
                    }
                }
            }
            if (column === 'halfNotes' && this.nullNotesBlocked) {
                const anyHalfNoteComplete = this.halfNotes.some(note => note.doneListItems.every(item => item));
                if (anyHalfNoteComplete) {
                  this.nullNotesBlocked = false;
                }
             }
            if (column === 'doneNotes') {
                if (this.halfNotes.length < 5 && this.doneNotesWithLastDoneAt.length) {
                    this.halfNotesBlocked = false;
                } else if (this.halfNotes.length === 5 && !this.doneNotes.length) {
                    this.blockHalfNotesColumn();
                }
            }
        },  
        moveNoteToSecondColumn(noteIndex) {
            const note = this.nullNotes[noteIndex];
            const percentageDone = note.percentageDone;
        
            if (percentageDone >= 50 && this.halfNotes.length >= 5) {
                alert('Нельзя добавить более 5-ти карточек во второй столбец');
                this.editedTask = null;
                this.editedTaskIndex = null;
                this.editedColumn = null;
                this.isColumnBlocked = true;
            } else if (percentageDone >= 50) {
                this.halfNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
                
                if (this.nullNotes.some(note => note.percentageDone >= 50)) {
                    this.halfNotes.unshift(this.nullNotes.shift());
                    this.editedTask = null;
                    this.editedTaskIndex = null;
                    this.editedColumn = null;
                }
            }
        },        
        checkDoneNotes() {
            const doneNote = initialData.doneNotes.find(note => note.doneListItems.filter(Boolean).length === note.lists.length);
            if (doneNote) {
              this.doneNotesWithLastDoneAt.push(doneNote);
              initialData.doneNotes = initialData.doneNotes.filter(note => note !== doneNote);
            }
        },       
        unlockColumn() {
            this.isColumnBlocked = false;
        },   
        autoMoveNoteAndBlock(index, column) {
            if (this.halfNotes.length >= 5 && this.nullNotes[index].percentageDone >= 50) {
                this.isColumnBlocked = true;
                // блокируем редактирование первого столбца
                this.editedNote = null;
                this.editedNoteIndex = null;
                this.editedColumn = null;
            } else {
                this.autoMoveNote(index, column);
            }
        },        
    },
    computed: {
        nullNotesWithDoneCount() {
            return this.nullNotes.map((note, index) => {
                const totalListItemsCount = note.lists.length;
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                return (doneListItemsCount / totalListItemsCount) * 100;
            });
        },
        halfNotesWithDoneCount() {
            return this.halfNotes.map((note, index) => {
                const totalListItemsCount = note.lists.length;
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                const percentageDone = (doneListItemsCount / totalListItemsCount) * 100;
                if (percentageDone === 100) {
                    this.unlockColumn();
                }
                return percentageDone;
            });
        },
        percentageDone() {
            return (noteIndex, listIndex) => {
              const note = this.nullNotes[noteIndex] || this.halfNotes[noteIndex];
              if (note) {
                const totalListItemsCount = note.lists.length;
                const doneListItemsCount = note.doneListItems.filter(Boolean).length;
                return (doneListItemsCount / totalListItemsCount) * 100;
              }
              return 0;
            }
        },
        doneNotesWithLastDoneAtComputed() {
            return this.doneNotes.map(note => {
                return { ...note, lastDoneAt: new Date().toLocaleString() };
            });
        },       
    },

    watch: {
        nullNotesWithDoneCount: {
            deep: true,
            handler(newVal, oldVal) {
                newVal.forEach((count, index) => {
                    this.autoMoveNote(index, 'nulled');
                });
            }
        },
        halfNotesWithDoneCount: {
            deep: true,
            handler(newVal, oldVal) {
                newVal.forEach((count, index) => {
                    if (!this.isColumnBlocked) {
                        this.autoMoveNote(index, 'halfNotes');
                    }
                });
            }
        },
        nullNotes: {
            deep: true,
            handler() {
                this.saveData();
            }
        },
        halfNotes: {
            deep: true,
            handler() {
                this.saveData();
            }
        },
        doneNotes: {
            handler(newVal) {
                this.doneNotesWithLastDoneAtComputed = newVal.map(note => {
                    return { ...note, lastDoneAt: new Date().toLocaleString() };
                });
            },
            deep: true
        },
    },
},);
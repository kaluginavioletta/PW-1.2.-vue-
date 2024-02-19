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
        blockFirstColumn() {
            const halfNotesWithMoreThan50Percent = this.nullNotes.some(note => (note.doneListItems.length / note.lists.length) * 100 > 50);
            const halfNotesWithoutFullyDone = !this.halfNotes.some(note => note.doneListItems.length === note.lists.length);
            if (!this.nullNotes || !this.halfNotes || !this.doneNotes) {
                return;
            }
          
            if (this.halfNotes.length === 5 && halfNotesWithMoreThan50Percent && halfNotesWithoutFullyDone) {
              this.isColumnBlocked = true;
            } else {
              this.isColumnBlocked = false;
            }
        },
        // blockHalfNotesColumn() {
        //     if (this.halfNotes.length >= 5 && !this.doneNotes.length) {
        //         this.halfNotesBlocked = true;
        //     }
        // },
        loadData() {
            this.nullNotes = JSON.parse(localStorage.getItem(`${storageKey}NullNotes`) || '[]');
            this.halfNotes = JSON.parse(localStorage.getItem(`${storageKey}HalfNotes`) || '[]');
            this.doneNotes = JSON.parse(localStorage.getItem(`${storageKey}DoneNotes`) || '[]');
        
            // Add lastDoneAt property to doneNotes if it doesn't exist
            this.doneNotes = this.doneNotes.map(note => ({ ...note, lastDoneAt: note.hasOwnProperty('lastDoneAt') ? note.lastDoneAt : new Date().toLocaleString() }));
        
            // Add this line to update doneNotesWithLastDoneAt
            this.doneNotesWithLastDoneAt = this.doneNotes.map(note => ({ ...note, lastDoneAt: new Date().toLocaleString() }));
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
            } 
            else if (percentageDone >= 50) {
                if (column === 'nulled') {
                    if (this.halfNotes.length >= 5){
                        alert('Нельзя добавить более 5-ти карточек во второй список');
                        // Блокируем редактирование первого столбца
                        this.editedTask = null;
                        this.editedTaskIndex = null;
                        this.editedColumn = null;
                    }
                    else{
                        this.halfNotes.push(this.nullNotes.splice(noteIndex, 1)[0]);
                        // Проверяем, если удаляется карточка из первого столбца и он содержит задачи с процентом выполнения >= 50
                        if (this.nullNotes.some(note => note.percentageDone >= 50)) {
                            this.halfNotes.unshift(this.nullNotes.shift()); // Переносим первую задачу из первого столбца во второй
                            // Блокируем редактирование первого столбца
                            this.editedTask = null;
                            this.editedTaskIndex = null;
                            this.editedColumn = null;
                        }
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
        // moveAndBlock() {
        //     if (this.halfNotes.some(note => note.doneListItems.length === note.lists.length)) {
        //         // Если любая карточка в halfNotes полностью выполнена
        //         this.isColumnBlocked = false;
        //     } else if (this.nullNotes.some(note => (note.doneListItems.length / note.lists.length) * 100 >= 50)) {
        //         // Если какая-то карточка в nullNotes достигла 50% выполнения
        //         this.isColumnBlocked = true; // блокируем редактирование первого столбца
        //         this.editedColumn = "first"; // Указываем, что первый столбец должен быть заблокирован
        //     } else if (this.halfNotes.length < 5 && this.isColumnBlocked === false) {
        //         this.halfNotes.push(this.nullNotes.pop());
        //     }
        // },
        // checkDoneNotes() {
        //     const doneNote = this.doneNotes.find(note => note.doneListItems.filter(Boolean).length === note.lists.length);
        //     if (doneNote) {
        //       this.doneNotesWithLastDoneAt.push(doneNote);
        //       this.doneNotes = this.doneNotes.filter(note => note !== doneNote);
        //       this.moveAndBlock();
        //     }
        // },        
        unlockColumn() {
            this.isColumnBlocked = false;
            // разблокируйте редактирование первого столбца
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
        saveData() {
            const data = {
                nullNotes: this.nullNotes,
                halfNotes: this.halfNotes,
                doneNotes: this.doneNotes
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
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
                return (doneListItemsCount / totalListItemsCount) * 100;
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
        // doneHalfNotesCount() {
        //     return this.halfNotes.filter(note => {
        //         const doneListItemsCount = note.doneListItems.filter(Boolean).length;
        //         const totalListItemsCount = note.lists.length;
        //         const percentageDone = (doneListItemsCount / totalListItemsCount) * 100;
        //         return percentageDone === 100;
        //     }).length;
        // }, 
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
                    this.autoMoveNote(index, 'halfNotes');
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
        // 'nullNotesWithDoneCount.length': {
        //     handler() {
        //         this.blockFirstColumn();
        //     }
        // },
        // 'nullNotesWithDoneCount.1': {
        //     handler(newVal, oldVal) {
        //         if (newVal.percentageDone === 100) {
        //             const doneNote = this.doneNotes.find(note => note.id === newVal.id);
        //             if (doneNote) {
        //                 doneNote.lastDoneAt = new Date().toLocaleString(); // Update lastDoneAt for existing doneNote
        //             } else {
        //                 const newDoneNote = { ...newVal, lastDoneAt: new Date().toLocaleString() };
        //                 this.doneNotes.push(newDoneNote); // Add new doneNote to doneNotes array
        //             }
        //             this.halfNotes.splice(1, 1);
        //             this.isColumnBlocked = false;
        //         }
        //     },
        //     deep: true
        // },        
        // 'halfNotesWithDoneCount.length': {
        //     handler() {
        //         this.blockHalfNotesColumn();
        //     }
        // },
        // 'halfNotesWithDoneCount.4': {
        //     handler(newVal, oldVal) {
        //         if (newVal.percentageDone === 100) {
        //             const doneNote = this.doneNotes.find(note => note.id === newVal.id);
        //             if (doneNote) {
        //                 doneNote.lastDoneAt = new Date().toLocaleString(); // Update lastDoneAt for existing doneNote
        //             } else {
        //                 const newDoneNote = { ...newVal, lastDoneAt: new Date().toLocaleString() };
        //                 this.doneNotes.push(newDoneNote); // Add new doneNote to doneNotes array
        //             }
        //             this.halfNotes = this.halfNotes.filter(note => note.id !== newVal.id); // Удаление заметки из halfNotes
        //             this.isColumnBlocked = false;
        //         }
        //     },
        //     deep: true
        // },              
    },
},);
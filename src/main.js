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
            editedTask: null,
            editedTaskIndex: null,
            editedColumn: null,
            showForm: false,
        }
    },
    methods: {
        addNote() {
            const nullListItems = this.newList.map(() => false);
            this.nullNotes.push({
                ...this.newNote,
                lists: this.newList,
                nullListItems,
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
                alert('Необходимо заполнить хотя бы 3 списка');
                return;
            }
            if (this.newList.length < 3 || this.newList.length > 5) {
                alert('Количество списков должно быть в диапазоне от 3 до 5');
                return;
            }
            if (this.nullNotes.length >= 3) {
                alert('Нельзя добавить более 3-х заметок в первый список');
                return;
            }
            if (this.halfNotes.length >= 5) {
                alert('Нельзя добавить более 5-ти заметок во второй список');
                return;
            }
            if (this.newNote.title && this.newList.length >= 3 && this.newList.every(listItem => listItem.title)) {
                const newNoteData = {
                    title: this.newNote.title,
                    lists: this.newList.map(listItem => ({ title: listItem.title, done: false })),
                    nullListItems: this.newList.map(() => false),
                    createdAt: new Date().toLocaleString(),
                    lastChange: null
                };
                this.nullNotes.push(newNoteData);
                this.newNote = { title: '' };
                this.newList = [{ title: '' }];
            }
        },
    }
});
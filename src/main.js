new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                { id: 1, title: "0%", maxCards: 3, cards: [] },
                { id: 2, title: "50%", maxCards: 5, cards: [] },
                { id: 3, title: "100%", maxCards: Infinity, cards: [] }
            ],
            lists: [
                { title: '', checked: false },
                { title: '', checked: false },
                { title: '', checked: false },
            ],
            newCardTitle: "",
            newListTitle: "",        
            maxNumberOfLists: 5,
            minNumberOfLists: 3,
        }
    },
    methods: {
        addMoreInput() {
            if (this.lists.length < 5) {
                this.lists.push({ title: this.newListTitle });
                this.newListTitle = '';
            } else {
                alert('Максимальное количество списков достигнуто');
            }
        },
        resetNewCard() {
            this.newCard = {
                title: '',
                lists: [{ title: '', checked: false }, { title: '', checked: false }, { title: '', checked: false }]
            };
        },
        checkNewListTitle() {
            if (this.newListTitle) {
                this.$emit('add-list', {
                    title: this.newListTitle,
                    items: this.newListItems,
                });
                this.resetNewLists();
            }
        },
        addCardToColumn() {
            if (this.newCardTitle.trim() !== '') {
                const cardLists = this.lists.map(list => ({ title: list.title, checked: false }));
                this.addCard(1, { title: this.newCardTitle, lists: cardLists, completed: '', column: 1 });
                this.newCardTitle = ""; // Clear the input field after adding the card
            }
        },
        addCard(columnId) {
            const columnIndex = this.columns.findIndex(column => column.id === columnId);
            const newCard = { title: this.newCardTitle, lists: this.lists };
            if (columnIndex !== -1 && this.columns[columnIndex].cards.length < this.columns[columnIndex].maxCards) {
                newCard.list = this.lists[0];
                this.columns[columnIndex].cards.push(newCard);
                this.newCardTitle = '';
            } else if (columnIndex === 0 && this.columns[columnIndex].cards.length === this.columns[columnIndex].maxCards) {
                alert('0% column is full');
            } else if (columnIndex !== 0 && this.columns[columnIndex].cards.length >= this.columns[columnIndex].maxCards) {
                alert('Column is full, please move cards first.');
            }
        },
        addItemToList(listIndex) {
            this.newLists[listIndex].items.push({ title: '', checked: false });
        },
        saveData() {
            localStorage.setItem('columns', JSON.stringify(this.columns)); // сохраняем данные в localStorage
        },
        moveCardToColumn(card, column) {
            const index = this.columns.findIndex(col => col === card.column);
            this.columns[index].cards = this.columns[index].cards.filter(c => c !== card);
            column.cards.push(card);
            card.column = column;
        },
        updateCardCompletionPercentage(card) {
            const firstListItemsFilled = this.lists[0].items.some(item => item.title.trim().length === 0);
            const newCardTitleFilled = this.newCardTitle.trim().length > 0;
            return !firstListItemsFilled && newCardTitleFilled;
        },
        checkItems(index) {
            const checkedCount = this.lists.filter(item => item.checked).length;
            const completionPercentage = (checkedCount / this.lists.length) * 100;
            if (this.card.column === 1 && completionPercentage > 50) {
                this.$emit('move-to-column', this.card, 2);
            } else if (this.card.column === 2 && completionPercentage === 100) {
                this.$emit('move-to-column', this.card, 3);
            }
            this.$emit('update-lists', this.lists); // Emit event to update lists in the parent component
        },
    },
    computed: {
        canAddCard() {
          return this.newCardTitle.trim() !== '' && this.lists.some(list => list.title.trim() !== '');
        },
        canAddList() {
          return this.newListTitle.trim() !== '';
        },
    },
    watch: {
        columns: {
            handler(newColumns) {
                localStorage.setItem('trello-board', JSON.stringify(newColumns));
            },
            deep: true
        }
    }
});
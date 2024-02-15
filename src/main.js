Vue.component('board', {
    template: `
    <form @submit.prevent="addCardToColumn" style="display: flex; justify-content: center; margin-bottom: 20px; flex-direction: column">
        <input type="text" v-model="newCardTitle" placeholder="Введите задачу">
        <div v-for="(list, listIndex) in newLists" :key="list.id">
        <input type="text" v-model="list.title" placeholder="Введите название списка">
        </div>
            <button type="submit" @click="addList" :disabled="newLists.length >= maxNumberOfLists">Добавить список</button>
            <button type="submit" @click="addCardToColumn" :disabled="!canAddCard || !canAddCardWithLists">Добавить карточку</button>
    </form>
    <div style="display: flex; justify-content: space-around;">
        <column v-for="column in columns" :column="column" :key="column.id">
        <card v-for="card in column.cards" :key="card.id" :card="card" :columns="columns" @check-items="checkItems"></card>
        </column>
    </div>
    `,
    data() {
        return {
            columns: [
                { id: 1, title: "0%", maxCards: 3, cards: [] },
                { id: 2, title: "50%", maxCards: 5, cards: [] },
                { id: 3, title: "100%", maxCards: Infinity, cards: [] }
            ],
            newLists: [
                    { id: 1, title: '', checked: false },
                    { id: 2, title: '', checked: false },
                    { id: 3, title: '', checked: false }
            ],
            maxNumberOfLists: 5,
            newCardTitle: "",
            minNumberOfLists: 3,
        }
    },
    computed: {
        addList() {
            if (this.newListTitle && this.newListTitle.trim() !== '') {
              const newList = {
                id: Date.now(),
                title: this.newListTitle.trim(),
                items: [{ title: '', checked: false }, { title: '', checked: false }, { title: '', checked: false }],
              };
        
              this.newLists.push(newList);
              this.newListTitle = '';
            }
        },
        canAddCard() {
            return this.newLists.length <= this.maxNumberOfLists;
        },
        canAddCardWithLists() {
            const allItems = this.newLists.flatMap(list => list.items);
            return allItems.filter(item => item.title.trim()).length >= 3;
        },
        shouldBlockFirstColumn() {
            const secondColumnCards = this.columns[1].cards;
            return secondColumnCards.length === 5 && this.columns[0].cards.some(card => card.completedItemsPercentage > 50);
        }
    },
    methods: {
        resetNewCard() {
            this.newCard = {
                title: '',
                items: [{ title: '', checked: false }, { title: '', checked: false }, { title: '', checked: false }]
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
        addCard(columnId, newCard) {
            const columnIndex = this.columns.findIndex(c => c.id === columnId);
            if (columnIndex !== -1 && this.columns[columnIndex].cards.length < this.columns[columnIndex].maxCards) {
                newCard.list = this.newLists[0];
                this.columns[columnIndex].cards.push(newCard);
                this.newCardTitle = '';
            } else if (columnIndex === 0 && this.columns[columnIndex].cards.length === this.columns[columnIndex].maxCards) {
                alert('0% column is full');
            } else if (columnIndex !== 0 && this.columns[columnIndex].cards.length >= this.columns[columnIndex].maxCards) {
                alert('Column is full, please move cards first.');
            }
        },
        addList() {
            if (this.newListTitle && this.newListTitle.trim() !== '') {
                const newList = {
                    title: this.newListTitle.trim(),
                    items: this.newItems.map(item => ({ ...item, title: item.title.trim() })),
                };
        
                this.newLists.push(newList);
                this.newListTitle = '';
                this.newItems = [{ title: '', checked: false }, { title: '', checked: false }, { title: '', checked: false }];
            }
        },
        addToList() {
            if (this.newListTitle && this.newListTitle.trim() !== '') {
              const newList = {
                title: this.newListTitle.trim(),
                items: [{ title: '', checked: false }, { title: '', checked: false }, { title: '', checked: false }],
              };
          
              this.newLists.push(newList);
              this.newListTitle = '';
            }
        },
        addItemToList(listIndex) {
            this.newLists[listIndex].items.push({ title: '', checked: false });
        },
        saveData() {
            localStorage.setItem('columns', JSON.stringify(this.columns)); // сохраняем данные в localStorage
        },
        computed: {
            canAddCard() {
                return this.newLists.length >= this.minNumberOfLists && this.newLists.length <= this.maxNumberOfLists;
            },
            canAddCardWithLists() {
                const allItems = this.newLists.flatMap(list => list.items);
                return allItems.filter(item => item.title.trim()).length >= 3;
            },
            shouldBlockFirstColumn() {
                const secondColumnCards = this.columns[1].cards;
                return secondColumnCards.length === 5 && this.columns[0].cards.some(card => card.completedItemsPercentage > 50);
            }
        },
        checkItems(card) {
            const checkedCount = this.card.items.filter(item => item.checked).length;
            const completionPercentage = (checkedCount / this.card.items.length) * 100;
            if (this.card.column === 1 && completionPercentage > 50) {
                this.$emit('move-to-column', this.card, 2);
            } else if (this.card.column === 2 && completionPercentage === 100) {
                this.$emit('move-to-column', this.card, 3);
            }
            this.updateCardCompletionPercentage(card);
        },
        moveCardToColumn(card, column) {
            const index = this.columns.findIndex(col => col === card.column);
            this.columns[index].cards = this.columns[index].cards.filter(c => c !== card);
            column.cards.push(card);
            card.column = column;
        },
        updateCardCompletionPercentage(card) {
            const checkedCount = card.items.filter(item => item.checked).length;
            card.completedItemsPercentage = (checkedCount / card.items.length) * 100;
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

Vue.component('card', {
    props: {
        card: {
            type: Object,
            required: true,
        },
    },
    template: `
    <div class="card" :style="{ backgroundColor: card.column === 0 ? 'cornflowerblue' : card.column === 1 ? 'lightgreen' : 'lightgray' }">
        <h3>{{ card.title }}</h3>
        <div v-for="item in card.items" :key="item.id">
            <input type="checkbox" v-model="item.checked" @change="checkItems">
            <label :class="{ completed: item.checked }">{{ item.title }}</label>
        </div>
        <span v-if="card.completed">{{ card.completed }}</span>
    </div>
    `,
    methods: {
        checkItems(card) {
            const checkedCount = card.items.filter(item => item.checked).length;
            const completionPercentage = (checkedCount / card.items.length) * 100;
            if (card.column === 1 && completionPercentage > 50) {
              this.$emit('move-to-column', card, 2);
            } else if (card.column === 2 && completionPercentage === 100) {
              this.$emit('move-to-column', card, 3);
            }
            this.updateCardCompletionPercentage(card);
          },
    },
});

Vue.component('column', {
    props: {
        column: {
            type: Object,
            required: true
        }
    },
    template: `
    <div class="column">
      <h2>{{ column.title }}</h2>
      <div v-for="card in column.cards">
        <card :card="card" @move-to-column="moveCard"></card>
      </div>
      <div v-if="column === 1 && isColumnFull">
        <p>Column 1 is full. Move cards to column 2 to continue editing.</p>
      </div>
    </div>
  `,
    computed: {
        isColumnFull() {
            return this.column.cards.length >= this.column.maxCards;
        }
    },
    methods: {
        moveCard(card, column) {
            if (column === 2) {
                this.$parent.moveCardToColumn(card, column);
            }
        }
    }
});


new Vue({
    el: '#app',
});
Vue.component('board', {
    template: `
    <form @submit.prevent="addCardToColumn" style="display: flex; justify-content: center; margin-bottom: 20px; flex-direction: column">
        <input type="text" v-model="newCardTitle" placeholder="Введите задачу">
        <div v-for="(list, listIndex) in newLists" :key="list.id">
            <input type="text" v-model="list.title" placeholder="Введите название списка">
        </div>
        <button type="submit" @click="addList" :disabled="newLists.length >= maxNumberOfLists">Добавить список</button>
        <form @submit.prevent="addCardToColumn">
        <button type="submit" @click="addCardToColumn" :disabled="!canAddCardWithLists">Добавить карточку</button>        
        </form>
    </form>
    <div style="display: flex; justify-content: space-around;">
            <column v-for="column in columns" :column="column" :key="column.id">
                <card v-for="card in column.cards" :key="card.id" :card="card" :columns="columns"></card>
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
    methods: {
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
            if (typeof this.newListTitle === 'string' && this.newListTitle.trim() !== '') {
                this.items.lists.push({ title: this.newListTitle });
                this.newListTitle = "";
            }
        },
        addToList() {
            this.addList(1, { title: this.newListTitle });
            this.newListTitle = "";
        },
        addItemToList(listIndex) {
            this.newLists[listIndex].items.push({ title: '', checked: false });
        },
        // removeList(listIndex) {
        //     if (this.newLists.length > this.minNumberOfLists) {
        //         this.newLists.splice(listIndex, 1);
        //     }
        // },
        addCardToColumn() {
            if (this.newCardTitle.trim() !== '') {
                this.addCard(1, { title: this.newCardTitle, items: [], completed: '', column: 1 });
                this.newCardTitle = ""; // Clear the input field after adding the card
            }
        
            if (this.columns[0].cards.length >= this.columns[0].maxCards) {
                alert('The 0% column is full. Please move cards to another column before adding a new one.');
            }
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
    <div class="card" style="background-color: cornflowerblue; text-align: center; border: 2px solid #0059ff7d; margin-bottom: 20px;">
        <h3>{{ card.title }}</h3>
        <div v-for="item in card.newLists.items" :key="item.id">
            <input type="checkbox" v-model="item.checked" @change="checkItems">
            <label :class="{ completed: item.checked }">{{ item.title }}</label>
        </div>
        <span v-if="card.completed">{{ card.completed }}</span>
    </div>
    `,
    methods: {
        checkItems() {
            const checkedCount = this.item.lists.filter(item => item.checked).length;
            const completionPercentage = (checkedCount / this.items.lists.length) * 100;
            if (this.card.column === 1 && completionPercentage > 50) {
                this.$emit('move-to-column', this.card, 2);
            } else if (this.card.column === 2 && completionPercentage === 100) {
                this.$emit('move-to-column', this.card, 3);
            }
        },
        // saveData() {
        //     localStorage.setItem('columns', JSON.stringify(this.$parent.columns)); // сохраняем данные в localStorage
        // },
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
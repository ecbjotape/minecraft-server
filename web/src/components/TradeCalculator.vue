<template>
  <div class="trade-calculator">
    <h2>💰 Calculadora de Escambo</h2>
    <p class="subtitle">Base: 1 Madeira = 1 ponto de valor</p>

    <div class="calculator-container">
      <!-- Main Calculator -->
      <div class="calculator-section">
        <h3>Calculadora de Conversão</h3>
        
        <div class="conversion-row">
          <div class="item-selector">
            <label>De:</label>
            <select v-model="fromItem" @change="calculate">
              <optgroup v-for="category in categories" :key="category.name" :label="category.name">
                <option v-for="item in category.items" :key="item.name" :value="item">
                  {{ item.name }} ({{ item.value }})
                </option>
              </optgroup>
            </select>
            <input 
              v-model.number="fromQuantity" 
              @input="calculate"
              type="number" 
              min="1" 
              placeholder="Quantidade"
            />
          </div>

          <div class="arrow">⇄</div>

          <div class="item-selector">
            <label>Para:</label>
            <select v-model="toItem" @change="calculate">
              <optgroup v-for="category in categories" :key="category.name" :label="category.name">
                <option v-for="item in category.items" :key="item.name" :value="item">
                  {{ item.name }} ({{ item.value }})
                </option>
              </optgroup>
            </select>
            <input 
              v-model.number="toQuantity" 
              type="number" 
              readonly
              placeholder="Resultado"
            />
          </div>
        </div>

        <div v-if="result" class="result-box">
          <p class="result-text">
            <strong>{{ fromQuantity }} {{ fromItem?.name }}</strong> 
            (valor: {{ totalFromValue }})
            equivale a aproximadamente 
            <strong>{{ toQuantity }} {{ toItem?.name }}</strong>
            (valor: {{ totalToValue }})
          </p>
          <p v-if="remainder > 0" class="remainder-text">
            Resto: {{ remainder }} pontos de valor
          </p>
        </div>

        <button @click="swapItems" class="swap-button">
          🔄 Inverter Itens
        </button>
      </div>

      <!-- Price Table -->
      <div class="price-table-section">
        <h3>📋 Tabela de Valores</h3>
        
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Buscar item..."
          />
        </div>

        <div class="categories">
          <div 
            v-for="category in categories" 
            :key="category.name" 
            class="category-group"
          >
            <h4 class="category-title">{{ category.icon }} {{ category.name }}</h4>
            <div class="items-grid">
              <div 
                v-for="item in filteredItems(category.items)" 
                :key="item.name"
                class="item-card"
                @click="quickSelect(item)"
              >
                <span class="item-name">{{ item.name }}</span>
                <span class="item-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Examples -->
    <div class="examples-section">
      <h3>⚡ Conversões Rápidas</h3>
      <div class="examples-grid">
        <div class="example-card" @click="loadExample(0)">
          <span>10 Ferros</span>
          <span class="example-arrow">→</span>
          <span>100 Madeiras</span>
        </div>
        <div class="example-card" @click="loadExample(1)">
          <span>1 Vaca (70)</span>
          <span class="example-arrow">→</span>
          <span>7 Ferros</span>
        </div>
        <div class="example-card" @click="loadExample(2)">
          <span>1 Cavalo (150)</span>
          <span class="example-arrow">→</span>
          <span>15 Ferros</span>
        </div>
        <div class="example-card" @click="loadExample(3)">
          <span>1 Diamante (120)</span>
          <span class="example-arrow">→</span>
          <span>12 Ferros</span>
        </div>
        <div class="example-card" @click="loadExample(4)">
          <span>1 Livro (30)</span>
          <span class="example-arrow">→</span>
          <span>3 Ferros</span>
        </div>
        <div class="example-card" @click="loadExample(5)">
          <span>1 Netherite Ingot</span>
          <span class="example-arrow">→</span>
          <span>125 Ferros</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Item {
  name: string;
  value: number;
}

interface Category {
  name: string;
  icon: string;
  items: Item[];
}

const categories = ref<Category[]>([
  {
    name: 'Recursos Básicos',
    icon: '🪵',
    items: [
      { name: 'Madeira', value: 1 },
      { name: 'Pedra', value: 1 },
      { name: 'Carvão', value: 4 },
      { name: 'Ferro', value: 10 },
      { name: 'Redstone', value: 8 },
      { name: 'Ouro', value: 25 },
      { name: 'Lápis-Lazúli', value: 6 },
      { name: 'Ametista', value: 30 },
      { name: 'Quartzo', value: 12 },
    ]
  },
  {
    name: 'Itens Processados',
    icon: '🧪',
    items: [
      { name: 'Barra de Ferro', value: 15 },
      { name: 'Barra de Ouro', value: 35 },
      { name: 'Bala de Fogo', value: 25 },
      { name: 'Tijolo de Pedra', value: 2 },
      { name: 'Vidro', value: 4 },
      { name: 'Pólvora', value: 20 },
      { name: 'Livro', value: 30 },
    ]
  },
  {
    name: 'Animais',
    icon: '🥩',
    items: [
      { name: 'Galinha', value: 30 },
      { name: 'Coelho', value: 40 },
      { name: 'Ovelha', value: 50 },
      { name: 'Porco', value: 55 },
      { name: 'Vaca', value: 70 },
      { name: 'Cavalo', value: 150 },
      { name: 'Lhama', value: 120 },
    ]
  },
  {
    name: 'Agricultura / Farmáveis',
    icon: '🌾',
    items: [
      { name: 'Trigo', value: 3 },
      { name: 'Cenoura', value: 2 },
      { name: 'Batata', value: 2 },
      { name: 'Cacto', value: 4 },
      { name: 'Cana-de-Açúcar', value: 4 },
      { name: 'Melancia (fatia)', value: 2 },
      { name: 'Abóbora', value: 6 },
      { name: 'Mel', value: 10 },
      { name: 'Favo de Mel', value: 20 },
    ]
  },
  {
    name: 'Itens Raros',
    icon: '🔥',
    items: [
      { name: 'Diamante', value: 120 },
      { name: 'Pérola do Ender', value: 90 },
      { name: 'Membrana de Phantom', value: 60 },
      { name: 'Netherite Scrap', value: 350 },
      { name: 'Netherite Ingot', value: 1500 },
      { name: 'Totem da Imortalidade', value: 2000 },
    ]
  }
]);

const fromItem = ref<Item | null>(null);
const toItem = ref<Item | null>(null);
const fromQuantity = ref<number>(1);
const toQuantity = ref<number>(0);
const searchQuery = ref<string>('');
const result = ref<boolean>(false);

const totalFromValue = computed(() => {
  return fromItem.value ? fromItem.value.value * fromQuantity.value : 0;
});

const totalToValue = computed(() => {
  return toItem.value ? toItem.value.value * toQuantity.value : 0;
});

const remainder = computed(() => {
  return totalFromValue.value - totalToValue.value;
});

const calculate = () => {
  if (fromItem.value && toItem.value && fromQuantity.value > 0) {
    const totalValue = fromItem.value.value * fromQuantity.value;
    toQuantity.value = Math.floor(totalValue / toItem.value.value);
    result.value = true;
  } else {
    result.value = false;
  }
};

const swapItems = () => {
  const tempItem = fromItem.value;
  const tempQuantity = fromQuantity.value;
  
  fromItem.value = toItem.value;
  fromQuantity.value = toQuantity.value;
  
  toItem.value = tempItem;
  toQuantity.value = tempQuantity;
  
  calculate();
};

const quickSelect = (item: Item) => {
  if (!fromItem.value) {
    fromItem.value = item;
  } else {
    toItem.value = item;
    calculate();
  }
};

const filteredItems = (items: Item[]) => {
  if (!searchQuery.value) return items;
  return items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
};

const loadExample = (index: number) => {
  const examples = [
    { from: 'Ferro', fromQty: 10, to: 'Madeira', toQty: 0 },
    { from: 'Vaca', fromQty: 1, to: 'Ferro', toQty: 0 },
    { from: 'Cavalo', fromQty: 1, to: 'Ferro', toQty: 0 },
    { from: 'Diamante', fromQty: 1, to: 'Ferro', toQty: 0 },
    { from: 'Livro', fromQty: 1, to: 'Ferro', toQty: 0 },
    { from: 'Netherite Ingot', fromQty: 1, to: 'Ferro', toQty: 0 },
  ];

  const example = examples[index];
  
  // Find items
  let foundFrom: Item | null = null;
  let foundTo: Item | null = null;
  
  categories.value.forEach(category => {
    category.items.forEach(item => {
      if (item.name === example.from) foundFrom = item;
      if (item.name === example.to) foundTo = item;
    });
  });

  if (foundFrom && foundTo) {
    fromItem.value = foundFrom;
    toItem.value = foundTo;
    fromQuantity.value = example.fromQty;
    calculate();
  }
};

// Initialize with default values
fromItem.value = categories.value[0].items[0]; // Madeira
toItem.value = categories.value[0].items[3]; // Ferro
fromQuantity.value = 10;
calculate();
</script>

<style scoped>
.trade-calculator {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.trade-calculator h2 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 28px;
}

.subtitle {
  color: #64748b;
  margin-bottom: 30px;
  font-size: 14px;
}

.calculator-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 1024px) {
  .calculator-container {
    grid-template-columns: 1fr;
  }
}

.calculator-section,
.price-table-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calculator-section h3,
.price-table-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.conversion-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .conversion-row {
    flex-direction: column;
  }
}

.item-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-selector label {
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.item-selector select,
.item-selector input {
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.item-selector select:focus,
.item-selector input:focus {
  outline: none;
  border-color: #3b82f6;
}

.item-selector input[readonly] {
  background: #f1f5f9;
  cursor: not-allowed;
}

.arrow {
  font-size: 24px;
  color: #64748b;
}

.result-box {
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.result-text {
  color: #0369a1;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.remainder-text {
  color: #0284c7;
  font-size: 12px;
  margin: 5px 0 0 0;
  font-style: italic;
}

.swap-button {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.swap-button:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.search-box {
  margin-bottom: 20px;
}

.search-box input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
}

.categories {
  max-height: 600px;
  overflow-y: auto;
}

.category-group {
  margin-bottom: 25px;
}

.category-title {
  color: #1e293b;
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
}

.item-name {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.item-value {
  font-size: 13px;
  color: #3b82f6;
  font-weight: 700;
}

.examples-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.examples-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.example-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 600;
}

.example-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.example-arrow {
  font-size: 16px;
  opacity: 0.9;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .trade-calculator h2,
  .calculator-section h3,
  .price-table-section h3,
  .examples-section h3 {
    color: #f1f5f9;
  }

  .subtitle {
    color: #94a3b8;
  }

  .calculator-section,
  .price-table-section,
  .examples-section {
    background: #1e293b;
  }

  .item-selector select,
  .item-selector input,
  .search-box input {
    background: #0f172a;
    color: #f1f5f9;
    border-color: #334155;
  }

  .item-card {
    background: #0f172a;
    border-color: #334155;
  }

  .item-card:hover {
    background: #1e293b;
  }

  .category-title {
    color: #cbd5e1;
    border-bottom-color: #334155;
  }

  .item-name {
    color: #cbd5e1;
  }

  .result-box {
    background: #0c4a6e;
    border-color: #075985;
  }

  .result-text {
    color: #bae6fd;
  }

  .remainder-text {
    color: #7dd3fc;
  }
}
</style>

import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      const productsList = productExists
        ? products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          )
        : [...products, { ...product, quantity: 1 }];

      setProducts(productsList);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(productsList),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsList = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(productsList);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(productsList),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const higherThanOne = products.filter(
        product => product.id === id && product.quantity > 1,
      )[0];

      const productsList = higherThanOne
        ? products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          )
        : products.filter(product => product.id !== id);

      setProducts(productsList);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(productsList),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

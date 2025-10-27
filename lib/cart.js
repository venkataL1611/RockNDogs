class Cart {
  constructor(oldCart) {
    this.items = (oldCart && oldCart.items) || {};
    this.totalQty = (oldCart && oldCart.totalQty) || 0;
    this.totalPrice = (oldCart && oldCart.totalPrice) || 0;
  }

  add(item, id) {
    let storedItem = this.items[id];
    if (!storedItem) {
      storedItem = { item, qty: 0, price: 0 };
      this.items[id] = storedItem;
    }
    storedItem.qty += 1;
    storedItem.price = storedItem.item.Price * storedItem.qty;
    this.totalQty += 1;
    this.totalPrice += storedItem.item.Price;
  }

  generateArray() {
    return Object.values(this.items);
  }
}

module.exports = Cart;

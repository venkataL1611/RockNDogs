class Cart {
  constructor(oldCart) {
    this.items = (oldCart && oldCart.items) || {};
    this.totalQty = (oldCart && oldCart.totalQty) || 0;
    this.totalPrice = (oldCart && oldCart.totalPrice) || 0;
  }

  add(item, id) {
    let storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = { item, qty: 0, price: 0 };
    }
    storedItem.qty++;
    storedItem.price = storedItem.item.Price * storedItem.qty;
    this.totalQty++;
    this.totalPrice += storedItem.item.Price;
  }

  generateArray() {
    return Object.values(this.items);
  }
}

module.exports = Cart;

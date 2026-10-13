/** Item mínimo del listado de productos (contrato `GET /api/product`). */
export type ProductListItem = {
  id: string
  brand: string
  model: string
  price: string
  imgUrl: string
}

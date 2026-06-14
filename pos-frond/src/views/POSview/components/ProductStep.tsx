import React from 'react'
import { Row, Col, InputGroup, FormControl, Button, Card } from 'react-bootstrap'
import { Product, Category } from '../../../utils/types'
import { Search } from 'react-bootstrap-icons'

interface ProductStepProps {
  products: Product[]
  categories: Category[]
  searchTerm: string
  onSearchTerm: (t:string)=>void
  onSearch: ()=>void
  onSelectCategory: (c:Category)=>void
  onProductClick: (p:Product)=>void
  selectPriceTypeId?: number
}

const ProductStep: React.FC<ProductStepProps> = ({
  products,categories,searchTerm,onSearchTerm,onSearch,onSelectCategory,onProductClick,selectPriceTypeId
})=>(
  <>
    <Row className="mb-2">
      <Col md={6}>
        {categories.map(cat=>(
          <Button size="sm" key={cat.id} onClick={()=>onSelectCategory(cat)} className="me-1">
            {cat.name}
          </Button>
        ))}
      </Col>
      <Col md={6}>
        <InputGroup size="sm">
          <FormControl value={searchTerm} onChange={e=>onSearchTerm(e.target.value)} />
          <Button onClick={onSearch}><Search /></Button>
        </InputGroup>
      </Col>
    </Row>
    <Row>
      {products.map(p=>(
        <Col xs={6} sm={4} md={3} key={p.id} className="mb-3">
          <Card onClick={()=>onProductClick(p)} style={{cursor:'pointer'}}>
            <Card.Img src={p.image} style={{height:100,objectFit:'cover'}}/>
            <Card.Body>
              <Card.Title className="fs-6">{p.name}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </>
)

export default ProductStep

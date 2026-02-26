'use client'

import { useState, useCallback } from 'react'
import { ProductBrowser } from '@/components/pos/ProductBrowser'
import { OrderSummary, OrderItem } from '@/components/pos/OrderSummary'
import { ScheduledOrdersView } from '@/components/pos/ScheduledOrdersView'
import { Database } from '@/types/database.types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Product = Database['public']['Tables']['products']['Row']

export default function POSPage() {
    const [orderItems, setOrderItems] = useState<OrderItem[]>([])

    const [activeTab, setActiveTab] = useState('new-order')

    const handleOrderScheduled = useCallback(() => {
        setActiveTab('scheduled')
    }, [])

    // Memoize callbacks to prevent unnecessary re-renders of child components (ProductBrowser, OrderSummary)
    // when POSPage state updates (e.g., when adding items or switching tabs).
    const handleAddToCart = useCallback((product: Product) => {
        setOrderItems((prev) => {
            const existingItem = prev.find((item) => !item.isCustom && item.product?.id === product.id)
            if (existingItem) {
                return prev.map((item) =>
                    !item.isCustom && item.product?.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1, isCustom: false }]
        })
    }, [])

    const handleAddCustomItem = useCallback((
        name: string,
        price: number,
        flowerItems: Array<{ productId: string; colorItems: Array<{ colorId: string; quantity: number }> }>
    ) => {
        setOrderItems((prev) => [
            ...prev,
            { customName: name, customPrice: price, quantity: 1, isCustom: true, flowerItems }
        ])
    }, [])

    const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
        setOrderItems((prev) => {
            return prev.map((item, index) => {
                const currentId = item.isCustom ? `custom-${index}` : item.product?.id || `item-${index}`
                if (currentId === itemId) {
                    const newQuantity = Math.max(1, item.quantity + delta)
                    return { ...item, quantity: newQuantity }
                }
                return item
            })
        })
    }, [])

    const handleRemoveItem = useCallback((itemId: string) => {
        setOrderItems((prev) => prev.filter((item, index) => {
            const currentId = item.isCustom ? `custom-${index}` : item.product?.id || `item-${index}`
            return currentId !== itemId
        }))
    }, [])

    const handleClearOrder = useCallback(() => {
        setOrderItems([])
    }, [])

    return (
        <div className="h-[calc(100vh-2rem)] p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="new-order">Nuevo Pedido</TabsTrigger>
                    <TabsTrigger value="scheduled">Pedidos Agendados</TabsTrigger>
                </TabsList>

                <TabsContent value="new-order" className="h-[calc(100%-3rem)]">
                    <div className="flex h-full gap-4">
                        <div className="flex-1 min-w-0">
                            <ProductBrowser onAddToCart={handleAddToCart} />
                        </div>
                        <div className="w-[400px] shrink-0">
                            <OrderSummary
                                items={orderItems}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemoveItem={handleRemoveItem}
                                onClearOrder={handleClearOrder}
                                onAddCustomItem={handleAddCustomItem}
                                onOrderScheduled={handleOrderScheduled}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="scheduled" className="h-[calc(100%-3rem)]">
                    <ScheduledOrdersView />
                </TabsContent>
            </Tabs>
        </div>
    )
}

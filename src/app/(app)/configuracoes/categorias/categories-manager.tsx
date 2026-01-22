"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Plus, Pencil, Trash2, CornerDownRight } from "lucide-react"
import { CategoryFormDialog } from "@/app/components/categories/category-form-dialog"
import { Badge } from "@/app/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog"

import {
  ShoppingCart, Home, Car, Plane, Utensils, Heart, Briefcase, GraduationCap,
  Zap, Smartphone, Wifi, Gift, Hammer, Dog, Baby, Shirt, Music, Coffee,
  Book, DollarSign, Umbrella, Camera, Landmark, Ticket, Film, Gamepad,
  Cross
} from "lucide-react"

const ICON_MAP: Record<string, any> = {
  "shopping-cart": ShoppingCart,
  "home": Home,
  "car": Car,
  "plane": Plane,
  "utensils": Utensils,
  "heart": Heart,
  "briefcase": Briefcase,
  "graduation-cap": GraduationCap,
  "zap": Zap,
  "smartphone": Smartphone,
  "wifi": Wifi,
  "gift": Gift,
  "hammer": Hammer,
  "dog": Dog,
  "baby": Baby,
  "shirt": Shirt,
  "music": Music,
  "coffee": Coffee,
  "book": Book,
  "dollar-sign": DollarSign,
  "umbrella": Umbrella,
  "camera": Camera,
  "landmark": Landmark,
  "ticket": Ticket,
  "film": Film,
  "gamepad": Gamepad,
  "cross": Cross
}

interface Category {
  id: string
  name: string
  type: string
  parentId: string | null
  icon: string | null
  color: string | null
  archived: boolean
  isDefault: boolean
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("expenses")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [parentForNewData, setParentForNewData] = useState<Category | null>(null)

  const [deleteData, setDeleteData] = useState<{ open: boolean, category: Category | null }>({ open: false, category: null })

  const categories = initialCategories

  const expenseTypes = ["essential", "non_essential"]
  const filteredCategories = categories.filter(c =>
    activeTab === "expenses"
      ? expenseTypes.includes(c.type)
      : c.type === "income"
  )

  const rootCategories = filteredCategories.filter(c => !c.parentId && !c.archived)
  const getChildren = (parentId: string) => filteredCategories.filter(c => c.parentId === parentId && !c.archived)

  const handleCreateRoot = () => {
    setEditingCategory(null)
    setParentForNewData(null)
    setIsDialogOpen(true)
  }

  const handleCreateSub = (parent: Category) => {
    setEditingCategory(null)
    setParentForNewData(parent)
    setIsDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setParentForNewData(null)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (category: Category) => {
    setDeleteData({ open: true, category })
  }

  const executeDelete = async () => {
    if (!deleteData.category) return

    try {
      const res = await fetch(`/api/categories/${deleteData.category.id}`, {
        method: "DELETE"
      })
      await res.json()

      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteData({ open: false, category: null })
    }
  }

  const renderIcon = (iconName: string | null, color: string | null) => {
    const IconComp = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : ShoppingCart
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
        style={{ backgroundColor: color || "#333" }}
      >
        <IconComp className="w-4 h-4" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Categorias</h2>
          <p className="text-sm text-muted-foreground">Personalize como você organiza suas finanças</p>
        </div>
        <Button onClick={handleCreateRoot} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2">
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="incomes">Receitas</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {rootCategories.length === 0 && (
            <div className="text-center py-10 opacity-50">
              Nenhuma categoria encontrada. Crie a primeira!
            </div>
          )}

          {rootCategories.map(root => {
            const children = getChildren(root.id)

            return (
              <div key={root.id} className="border rounded-xl bg-card overflow-hidden transition-all hover:shadow-sm">
                <div className="flex items-center justify-between p-4 group">
                  <div className="flex items-center gap-4">
                    {renderIcon(root.icon, root.color)}
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {root.name}
                        {root.isDefault && <Badge variant="secondary" className="text-[10px] h-4">Padrão</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {root.type ? root.type.replace('_', ' ') : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleCreateSub(root)} title="Adicionar Subcategoria">
                      <Plus className="w-4 h-4" />
                    </Button>
                    {!root.isDefault && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(root)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(root)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {children.length > 0 && (
                  <div className="bg-muted/30 border-t">
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between py-3 px-4 pl-8 group/sub hover:bg-muted/50 border-b last:border-0 border-dashed border-l-4 border-l-transparent hover:border-l-primary/20">
                        <div className="flex items-center gap-3">
                          <CornerDownRight className="w-4 h-4 text-muted-foreground/50" />
                          {renderIcon(child.icon, child.color)}
                          <span className="text-sm font-medium">{child.name}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/sub:opacity-100 transition-opacity">
                          {!child.isDefault && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(child)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(child)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Tabs>

      <CategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categoryToEdit={editingCategory}
        parentCategory={parentForNewData}
        categories={categories}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog open={deleteData.open} onOpenChange={(val) => !val && setDeleteData(d => ({ ...d, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir/arquivar a categoria "{deleteData.category?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader } from "@/app/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Plus, Pencil, Trash2, CornerDownRight, Sparkles, FolderTree, ArrowLeft, ChevronRight } from "lucide-react"
import { CategoryFormDialog } from "@/app/components/categories/category-form-dialog"
import { Badge } from "@/app/components/ui/badge"
import Link from "next/link"
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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: color || "#8b5cf6" }}
      >
        <IconComp className="w-5 h-5" />
      </div>
    )
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "essential": return "Essencial"
      case "non_essential": return "Não Essencial"
      case "income": return "Receita"
      default: return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "essential": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "non_essential": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "income": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Configurações
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-600">Organização</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <FolderTree className="w-5 h-5 text-white" />
              </div>
              Categorias
            </h1>
            <p className="text-muted-foreground mt-1">Personalize como você organiza suas finanças</p>
          </div>

          <Button
            onClick={handleCreateRoot}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Categoria</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex h-12 p-1.5 bg-muted/50 rounded-xl">
          <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            💸 Despesas
          </TabsTrigger>
          <TabsTrigger value="incomes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            💰 Receitas
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {rootCategories.length === 0 && (
            <Card variant="elevated" className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                  <FolderTree className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">Crie sua primeira categoria para começar a organizar</p>
                <Button onClick={handleCreateRoot} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Categoria
                </Button>
              </CardContent>
            </Card>
          )}

          {rootCategories.map(root => {
            const children = getChildren(root.id)

            return (
              <Card key={root.id} variant="elevated" className="overflow-hidden group/card hover:shadow-lg transition-all duration-300">
                <CardHeader className="p-0">
                  <div className="flex items-center justify-between p-4 sm:p-5 group">
                    <div className="flex items-center gap-4">
                      {renderIcon(root.icon, root.color)}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{root.name}</span>
                          {root.isDefault && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(root.type)}`}>
                            {getTypeLabel(root.type)}
                          </span>
                          {children.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              • {children.length} sub{children.length === 1 ? "categoria" : "categorias"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateSub(root)}
                        title="Adicionar Subcategoria"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {!root.isDefault && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(root)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                            onClick={() => handleDeleteClick(root)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-1 hidden sm:block" />
                    </div>
                  </div>
                </CardHeader>

                {children.length > 0 && (
                  <CardContent className="bg-muted/20 border-t p-0">
                    <div className="divide-y divide-border/50">
                      {children.map(child => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between py-3 px-4 sm:px-5 pl-6 sm:pl-8 group/sub hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CornerDownRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md"
                              style={{ backgroundColor: child.color || "#8b5cf6" }}
                            >
                              {child.icon && ICON_MAP[child.icon] ? (
                                (() => {
                                  const ChildIcon = ICON_MAP[child.icon]
                                  return <ChildIcon className="w-4 h-4" />
                                })()
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-sm font-medium">{child.name}</span>
                          </div>

                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/sub:opacity-100 transition-opacity">
                            {!child.isDefault && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                                  onClick={() => handleEdit(child)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                  onClick={() => handleDeleteClick(child)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
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
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              Excluir categoria?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>&quot;{deleteData.category?.name}&quot;</strong>.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

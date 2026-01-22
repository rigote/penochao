"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createCategorySchema, CreateCategoryInput, updateCategorySchema } from "@/lib/validations/finance"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { cn } from "@/lib/utils"
// Icons
import {
  ShoppingCart, Home, Car, Plane, Utensils, Heart, Briefcase, GraduationCap,
  Zap, Smartphone, Wifi, Gift, Hammer, Dog, Baby, Shirt, Music, Coffee,
  Book, DollarSign, Umbrella, Camera, Landmark, Ticket, Film, Gamepad,
  Cross
} from "lucide-react"

// Map of available icons
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

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#78716c"
]

interface Category {
  id: string
  name: string
  type: string
  parentId: string | null
  icon: string | null
  color: string | null
  archived: boolean
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryToEdit?: Category | null
  parentCategory?: Category | null // If creating a subcategory directly
  categories: Category[] // For parent selection logic if needed
  onSuccess: () => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  categoryToEdit,
  parentCategory,
  onSuccess
}: CategoryFormDialogProps) {
  const [activeTab, setActiveTab] = useState<"icon" | "color">("icon")
  const isEditing = !!categoryToEdit
  const isSubcategory = !!parentCategory || !!categoryToEdit?.parentId

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: "essential", // default, will change
      icon: "shopping-cart",
      color: "#ef4444",
      parentId: null
    }
  })

  // Reset/Populate form
  useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        form.reset({
          name: categoryToEdit.name,
          type: categoryToEdit.type as any,
          icon: categoryToEdit.icon || "shopping-cart",
          color: categoryToEdit.color || "#ef4444",
          parentId: categoryToEdit.parentId
        })
      } else {
        form.reset({
          name: "",
          type: parentCategory ? parentCategory.type as any : "essential", // Inherit type from parent
          icon: "shopping-cart",
          color: "#ef4444",
          parentId: parentCategory ? parentCategory.id : null
        })
      }
    }
  }, [open, categoryToEdit, parentCategory, form])

  async function onSubmit(data: CreateCategoryInput) {
    try {
      const url = isEditing
        ? `/api/categories/${categoryToEdit.id}`
        : "/api/categories"

      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to save category")

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      // toast error
    }
  }

  const selectedIcon = form.watch("icon")
  const selectedColor = form.watch("color")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border shadow-xl z-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${isSubcategory ? 'Subcategoria' : 'Categoria'}` : `Nova ${isSubcategory ? 'Subcategoria' : 'Categoria'}`}
          </DialogTitle>
          <DialogDescription>
            {isSubcategory && parentCategory ? `Adicionando dentro de: ${parentCategory.name}` : "Customize sua categoria"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input {...form.register("name")} placeholder="Ex: Mercado, Uber, Salário..." />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {!isSubcategory && !isEditing && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                defaultValue={form.getValues("type")}
                onValueChange={(val: any) => form.setValue("type", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[60]">
                  <SelectItem value="essential">Despesa Essencial</SelectItem>
                  <SelectItem value="non_essential">Despesa Não Essencial</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Visual Customization */}
          <div className="border rounded-lg p-4 space-y-4">
            <Label>Aparência</Label>

            <div className="flex gap-4 items-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-md transition-all duration-300"
                style={{ backgroundColor: selectedColor || "#333" }}
              >
                {selectedIcon && ICON_MAP[selectedIcon] ?
                  (() => { const Icon = ICON_MAP[selectedIcon]; return <Icon className="w-8 h-8" /> })()
                  : <ShoppingCart className="w-8 h-8" />
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Pré-visualização do ícone e cor
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="icon">Ícone</TabsTrigger>
                <TabsTrigger value="color">Cor</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                {activeTab === "icon" ? (
                  <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                    <div className="grid grid-cols-6 gap-2">
                      {Object.keys(ICON_MAP).map((key) => {
                        const Icon = ICON_MAP[key]
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => form.setValue("icon", key)}
                            className={cn(
                              "p-2 rounded-md hover:bg-muted flex items-center justify-center transition-all",
                              selectedIcon === key ? "bg-primary/20 ring-2 ring-primary" : ""
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="grid grid-cols-6 gap-3">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => form.setValue("color", color)}
                          className={cn(
                            "w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform",
                            selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

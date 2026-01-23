"use client"

import {
  ShoppingCart, Home, Car, Plane, Utensils, Heart, Briefcase, GraduationCap,
  Zap, Smartphone, Wifi, Gift, Hammer, Dog, Baby, Shirt, Music, Coffee,
  Book, DollarSign, Umbrella, Camera, Landmark, Ticket, Film, Gamepad,
  Cross, HelpCircle, ShoppingBag, Clapperboard, Wallet, CreditCard, Fuel,
  Pill, Bus, Globe, Tv, Scissors, Phone, Building2, Package, Receipt,
  Banknote, Target, CircleDollarSign, Lightbulb, Droplets, Flame, FileText,
  Shield, TrendingUp, Pizza, Salad, Tags
} from "lucide-react"
import type { ComponentType } from "react"

// Extended icon map for Lucide icons (kebab-case and PascalCase support)
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  // kebab-case (used in forms)
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
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
  "cross": Cross,
  "clapperboard": Clapperboard,
  "wallet": Wallet,
  "credit-card": CreditCard,
  "fuel": Fuel,
  "pill": Pill,
  "bus": Bus,
  "globe": Globe,
  "tv": Tv,
  "scissors": Scissors,
  "phone": Phone,
  "building": Building2,
  "package": Package,
  "receipt": Receipt,
  "banknote": Banknote,
  "target": Target,
  "circle-dollar-sign": CircleDollarSign,
  "lightbulb": Lightbulb,
  "droplets": Droplets,
  "flame": Flame,
  "file-text": FileText,
  "shield": Shield,
  "trending-up": TrendingUp,
  "pizza": Pizza,
  "salad": Salad,
  "tags": Tags,
  
  // PascalCase (some DBs might have this format)
  "ShoppingCart": ShoppingCart,
  "ShoppingBag": ShoppingBag,
  "Home": Home,
  "Car": Car,
  "Plane": Plane,
  "Utensils": Utensils,
  "Heart": Heart,
  "Briefcase": Briefcase,
  "GraduationCap": GraduationCap,
  "Zap": Zap,
  "Smartphone": Smartphone,
  "Wifi": Wifi,
  "Gift": Gift,
  "Hammer": Hammer,
  "Dog": Dog,
  "Baby": Baby,
  "Shirt": Shirt,
  "Music": Music,
  "Coffee": Coffee,
  "Book": Book,
  "DollarSign": DollarSign,
  "Umbrella": Umbrella,
  "Camera": Camera,
  "Landmark": Landmark,
  "Ticket": Ticket,
  "Film": Film,
  "Gamepad": Gamepad,
  "Cross": Cross,
  "Clapperboard": Clapperboard,
  "Wallet": Wallet,
  "CreditCard": CreditCard,
  "Fuel": Fuel,
  "Pill": Pill,
  "Bus": Bus,
  "Globe": Globe,
  "Tv": Tv,
  "Scissors": Scissors,
  "Phone": Phone,
  "Building2": Building2,
  "Package": Package,
  "Receipt": Receipt,
  "Banknote": Banknote,
  "Target": Target,
  "CircleDollarSign": CircleDollarSign,
  "Lightbulb": Lightbulb,
  "Droplets": Droplets,
  "Flame": Flame,
  "FileText": FileText,
  "Shield": Shield,
  "TrendingUp": TrendingUp,
  "Pizza": Pizza,
  "Salad": Salad,
  "Tags": Tags,
}

// Check if string is an emoji (starts with emoji unicode ranges)
function isEmoji(str: string): boolean {
  if (!str) return false
  // Simple emoji detection - emojis typically start with high unicode points
  const firstChar = str.codePointAt(0)
  return firstChar !== undefined && firstChar > 127
}

interface CategoryIconProps {
  icon: string | null
  className?: string
  fallback?: ComponentType<{ className?: string }>
}

export function CategoryIcon({ icon, className = "w-4 h-4", fallback: Fallback = HelpCircle }: CategoryIconProps) {
  if (!icon) {
    return <Fallback className={className} />
  }

  // If it's an emoji, render it directly
  if (isEmoji(icon)) {
    return <span className={className}>{icon}</span>
  }

  // Try to find in icon map
  const IconComp = ICON_MAP[icon]
  if (IconComp) {
    return <IconComp className={className} />
  }

  // Fallback: if it looks like text, try to render as emoji or show fallback icon
  return <Fallback className={className} />
}

// Helper function for use in places that need the render function pattern
export function renderCategoryIcon(iconName: string | null, className?: string) {
  return <CategoryIcon icon={iconName} className={className} />
}

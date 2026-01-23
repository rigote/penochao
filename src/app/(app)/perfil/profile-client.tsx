"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"
import { toast } from "sonner"
import {
  User,
  Mail,
  Camera,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Shield,
  Pencil,
  Crop,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ProfileUser {
  id: string
  name: string | null
  email: string
  image: string | null
  emailVerified: Date | null
  createdAt: Date
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ProfileClient({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // State
  const [name, setName] = useState(user.name || "")
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.image)

  // Crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState("")
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<CropType>()

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Handle URL params for success/error messages
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "email_changed") {
      toast.success("Email alterado com sucesso!", {
        description: "Seu email foi atualizado.",
      })
      router.replace("/perfil")
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        invalid_token: "Link inválido ou expirado",
        token_not_found: "Token não encontrado",
        token_expired: "O link expirou. Solicite uma nova alteração.",
        server_error: "Erro no servidor. Tente novamente.",
      }
      toast.error("Erro ao alterar email", {
        description: errorMessages[error] || "Erro desconhecido",
      })
      router.replace("/perfil")
    }
  }, [searchParams, router])

  // Save name
  const handleSaveName = async () => {
    if (!name.trim() || name === user.name) {
      setIsEditingName(false)
      return
    }

    setIsSavingName(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar")
      }

      toast.success("Nome atualizado!")
      setIsEditingName(false)
      router.refresh()
    } catch (error) {
      toast.error("Erro ao salvar nome", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setIsSavingName(false)
    }
  }

  // Handle file selection for crop
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de arquivo inválido", {
        description: "Use JPG, PNG, WebP ou GIF.",
      })
      return
    }

    // Validate file size (max 10MB before crop)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "Máximo permitido: 10MB",
      })
      return
    }

    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "")
      setCropDialogOpen(true)
    })
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // On image load, set initial crop
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }, [])

  // Generate cropped image and upload
  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return

    setIsUploadingAvatar(true)

    try {
      const image = imgRef.current
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("No 2d context")
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      }

      // Set output size to 256x256 for avatar
      canvas.width = 256
      canvas.height = 256

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        256,
        256,
      )

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create blob"))
          },
          "image/jpeg",
          0.9
        )
      })

      // Upload
      const formData = new FormData()
      formData.append("file", blob, "avatar.jpg")

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao fazer upload")
      }

      const { url } = await response.json()
      setAvatarUrl(url)
      setCropDialogOpen(false)
      setImgSrc("")
      toast.success("Foto atualizada!")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao fazer upload", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Delete avatar
  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true)
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao remover")
      }

      setAvatarUrl(null)
      toast.success("Foto removida!")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao remover foto", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setIsDeletingAvatar(false)
    }
  }

  // Request email change
  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return

    setIsChangingEmail(true)
    try {
      const response = await fetch("/api/profile/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao solicitar alteração")
      }

      setEmailSent(true)
      toast.success("Email de verificação enviado!", {
        description: `Confira sua caixa de entrada em ${newEmail}`,
      })
    } catch (error) {
      toast.error("Erro ao solicitar alteração", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setIsChangingEmail(false)
    }
  }

  const initials = (user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Conta</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card variant="elevated" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Sua foto aparece em toda a aplicação
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 border-4 border-background shadow-xl">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Alterar
              </Button>
              {avatarUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={isDeletingAvatar}
                  className="text-destructive hover:text-destructive"
                >
                  {isDeletingAvatar ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Remover
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG, WebP ou GIF. Máximo 10MB.
            </p>
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Seus dados de perfil e conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome
              </Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") {
                        setName(user.name || "")
                        setIsEditingName(false)
                      }
                    }}
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    size="sm"
                  >
                    {isSavingName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setName(user.name || "")
                      setIsEditingName(false)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <span className="font-medium">
                    {user.name || "Não informado"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium">{user.email}</span>
                  {user.emailVerified ? (
                    <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                      <AlertCircle className="w-3 h-3" />
                      Não verificado
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewEmail("")
                    setEmailSent(false)
                    setEmailDialogOpen(true)
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Account info */}
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Informações da Conta
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Membro desde</p>
                    <p className="font-medium">
                      {format(new Date(user.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status da conta</p>
                    <p className="font-medium text-emerald-600">Ativa</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setImgSrc("")
          setCrop(undefined)
          setCompletedCrop(undefined)
        }
        setCropDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-primary" />
              Ajustar Foto
            </DialogTitle>
            <DialogDescription>
              Arraste para ajustar o recorte da sua foto de perfil
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {imgSrc && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  className="max-h-[400px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[400px] w-auto"
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCropDialogOpen(false)
                setImgSrc("")
              }}
              disabled={isUploadingAvatar}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!completedCrop || isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Foto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Alterar Email
            </DialogTitle>
            <DialogDescription>
              {emailSent
                ? "Verificação enviada"
                : "Um email de confirmação será enviado para o novo endereço"}
            </DialogDescription>
          </DialogHeader>

          {emailSent ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Email enviado!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confira sua caixa de entrada em <strong>{newEmail}</strong> e clique no link para confirmar a alteração.
                </p>
              </div>
              <Button onClick={() => setEmailDialogOpen(false)} className="w-full">
                Entendi
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Email atual</Label>
                  <Input
                    id="current-email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Novo email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo@email.com"
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEmailDialogOpen(false)}
                  disabled={isChangingEmail}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRequestEmailChange}
                  disabled={!newEmail.trim() || isChangingEmail}
                >
                  {isChangingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Verificação"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

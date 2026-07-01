"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Category, createCategory, updateCategory } from "@/lib/products/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  parent_id: z.string().optional(),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CategoryModal({
  isOpen,
  onClose,
  categoryToEdit,
  allCategories,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  allCategories: Category[];
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parent_id: "none",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        form.reset({
          name: categoryToEdit.name,
          parent_id: categoryToEdit.parent_id || "none",
          description: categoryToEdit.description || "",
        });
      } else {
        form.reset({
          name: "",
          parent_id: "none",
          description: "",
        });
      }
    }
  }, [isOpen, categoryToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const parentId = values.parent_id === "none" ? null : values.parent_id;
    const desc = values.description?.trim() || null;

    try {
      if (categoryToEdit) {
        const result = await updateCategory(categoryToEdit.id, values.name, parentId, desc);
        if (!result.success) {
          toast.error(result.error);
        } else {
          toast.success("Categoría actualizada");
          onSuccess();
          onClose();
        }
      } else {
        const result = await createCategory(values.name, parentId, desc);
        if (!result.success) {
          toast.error(result.error);
        } else {
          toast.success("Categoría creada");
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoryToEdit ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          <DialogDescription>
            {categoryToEdit
              ? "Modifica los datos de tu categoría."
              : "Agrega una nueva categoría a tu catálogo."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Zapatos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría Padre (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguna (Nivel principal)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguna (Nivel principal)</SelectItem>
                      {allCategories
                        .filter((c) => c.id !== categoryToEdit?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentario / Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Agrega notas o descripción de esta categoría..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

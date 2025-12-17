"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface AddressData {
  // Full formatted address
  address?: string
  formatted_address: string
  
  // Coordinates (various naming conventions)
  lat: number | null
  lng: number | null
  latitude: number | null
  longitude: number | null
  
  // Address components
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  
  // Place ID for Google
  placeId?: string
}

interface AddressInputProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  onPlaceSelect?: (place: AddressData) => void
  onAddressSelect?: (place: AddressData) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Stub component - TODO: implement with Google Places Autocomplete
export function AddressInput({
  id,
  value = "",
  onChange,
  onPlaceSelect,
  onAddressSelect,
  placeholder = "Enter an address",
  className,
  disabled,
}: AddressInputProps) {
  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(className)}
      disabled={disabled}
    />
  )
}

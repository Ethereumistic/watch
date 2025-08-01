"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { POPULAR_COUNTRIES_BY_CONTINENT } from "@/lib/constants"

interface CountrySelectionModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedCountries: string[]
  onCountriesChange: (countries: string[]) => void
}

/**
 * A dedicated modal for selecting preferred countries from a list.
 * It's designed to be responsive and scrollable on all devices.
 */
export function CountrySelectionModal({
  isOpen,
  onOpenChange,
  selectedCountries,
  onCountriesChange,
}: CountrySelectionModalProps) {
  // Handles checking or unchecking a country.
  const handleCountryCheck = (checked: boolean, countryName: string) => {
    const newSelection = checked
      ? [...selectedCountries, countryName]
      : selectedCountries.filter((c) => c !== countryName)
    onCountriesChange(newSelection)
  }

  const renderCountryList = (countries: any[]) => {
    return countries.map((country) => (
      <div key={country.abbr} className="flex items-center space-x-2">
        <Checkbox
          id={`modal-country-${country.abbr}`}
          checked={selectedCountries.includes(country.name)}
          onCheckedChange={(checked) => handleCountryCheck(!!checked, country.name)}
          className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white flex-shrink-0"
        />
        <Label
          htmlFor={`modal-country-${country.abbr}`}
          className="text-xs font-normal flex items-center gap-1.5 cursor-pointer text-gray-300"
        >
          <img
            src={`https://flagcdn.com/16x12/${country.abbr}.png`}
            alt={country.name}
            className="rounded-sm flex-shrink-0"
          />
          <span className="line-clamp-1">{country.name}</span>
        </Label>
      </div>
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/30 backdrop-blur-xl border-gray-700 text-white w-[95vw] max-w-4xl p-0 flex flex-col h-[92dvh] sm:h-[66dvh]">
        <DialogHeader className="p-6 pb-1">
          <DialogTitle className="flex items-center gap-2 text-xl">
            Select Countries
          </DialogTitle>

        </DialogHeader>

        <div className="flex-grow px-6 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-8 p-2">
              {/* Column 1: Grouped continents (Africa, Oceania, South America) */}
              <div className="flex flex-col space-y-8">
                {POPULAR_COUNTRIES_BY_CONTINENT.Africa && (
                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm text-gray-300 border-b border-gray-600 pb-1">Africa</h5>
                    <div className="space-y-2">{renderCountryList(POPULAR_COUNTRIES_BY_CONTINENT.Africa)}</div>
                  </div>
                )}
                {POPULAR_COUNTRIES_BY_CONTINENT.Oceania && (
                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm text-gray-300 border-b border-gray-600 pb-1">Oceania</h5>
                    <div className="space-y-2">{renderCountryList(POPULAR_COUNTRIES_BY_CONTINENT.Oceania)}</div>
                  </div>
                )}
                {POPULAR_COUNTRIES_BY_CONTINENT["South America"] && (
                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm text-gray-300 border-b border-gray-600 pb-1">
                      South America
                    </h5>
                    <div className="space-y-2">
                      {renderCountryList(POPULAR_COUNTRIES_BY_CONTINENT["South America"])}
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Asia */}
              {POPULAR_COUNTRIES_BY_CONTINENT.Asia && (
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm text-gray-300 border-b border-gray-600 pb-1">Asia</h5>
                  <div className="space-y-2">{renderCountryList(POPULAR_COUNTRIES_BY_CONTINENT.Asia)}</div>
                </div>
              )}

              {/* UPDATED: Europe now spans 2 columns on all screen sizes */}
              {POPULAR_COUNTRIES_BY_CONTINENT.Europe && (
                <div className="space-y-3 col-span-2">
                  <h5 className="font-semibold text-sm text-gray-300 border-b border-gray-600 pb-1">Europe</h5>
                  {/* The internal grid always has 2 columns now */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {renderCountryList(POPULAR_COUNTRIES_BY_CONTINENT.Europe)}
                  </div>
                </div>
              )}

              {/* North America */}
              {POPULAR_COUNTRIES_BY_CONTINENT["North America"] && (
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm text-gray-300 border-b border-gray-600 pb-1">
                    North America
                  </h5>
                  <div className="space-y-2">
                    {renderCountryList(POPULAR_COUNTRIES_BY_CONTINENT["North America"])}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-gray-700 flex-row gap-2 mx-auto w-full">
          <Button
            variant="secondary"
            onClick={() => onCountriesChange([])}
            className="w-1/2 "
          >
            Match Any Country
          </Button>
          <Button
            variant="gradient"
            onClick={() => onOpenChange(false)}
            className="w-1/2 "
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

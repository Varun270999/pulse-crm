'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatINR } from '@/lib/utils';
import type { LineItemData } from '@/types/billing';

interface LineItemsTableProps {
  items: LineItemData[];
  onChangeItems: (items: LineItemData[]) => void;
  taxPercent: number;
  onChangeTaxPercent: (tax: number) => void;
  discountPercent: number;
  onChangeDiscountPercent: (discount: number) => void;
  disabled?: boolean;
}

export function LineItemsTable({
  items,
  onChangeItems,
  taxPercent,
  onChangeTaxPercent,
  discountPercent,
  onChangeDiscountPercent,
  disabled,
}: LineItemsTableProps) {
  function handleItemChange(
    index: number,
    field: keyof LineItemData,
    value: string | number
  ) {
    const newItems = [...items];
    const current = { ...newItems[index] };

    if (field === 'description') {
      current.description = String(value);
    } else if (field === 'quantity') {
      const qty = parseFloat(String(value)) || 0;
      current.quantity = qty;
      current.amount = Math.round(qty * current.unitPrice * 100) / 100;
    } else if (field === 'unitPrice') {
      const price = parseFloat(String(value)) || 0;
      current.unitPrice = price;
      current.amount = Math.round(current.quantity * price * 100) / 100;
    }

    newItems[index] = current;
    onChangeItems(newItems);
  }

  function handleAddItem() {
    onChangeItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return;
    onChangeItems(items.filter((_, i) => i !== index));
  }

  // Calculations
  const subtotal = Math.round(
    items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0) * 100
  ) / 100;

  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * (taxPercent / 100) * 100) / 100;
  const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Line Items & Pricing</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={disabled}
          className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Item</span>
        </Button>
      </div>

      {/* Line items table */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border/70 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-2.5 px-3 min-w-[240px]">Item & Description</th>
                <th className="py-2.5 px-3 w-28 text-right">Qty</th>
                <th className="py-2.5 px-3 w-36 text-right">Unit Price (₹)</th>
                <th className="py-2.5 px-3 w-36 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-muted/20 transition-colors">
                  {/* Description */}
                  <td className="p-2.5 align-top">
                    <Input
                      placeholder="e.g. Cloud Infrastructure Setup & Configuration"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                      disabled={disabled}
                      className="text-xs h-9"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="p-2.5 align-top text-right">
                    <Input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="1"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', e.target.value)
                      }
                      disabled={disabled}
                      className="text-xs h-9 text-right tabular-nums"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="p-2.5 align-top text-right">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.unitPrice || ''}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPrice', e.target.value)
                      }
                      disabled={disabled}
                      className="text-xs h-9 text-right tabular-nums"
                    />
                  </td>

                  {/* Amount (computed) */}
                  <td className="p-2.5 align-middle text-right font-medium text-foreground text-xs tabular-nums">
                    {formatINR(item.amount)}
                  </td>

                  {/* Delete button */}
                  <td className="p-2.5 align-middle text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={disabled || items.length <= 1}
                      className="p-1 text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors rounded"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary Calculation Panel */}
      <div className="flex flex-col sm:flex-row justify-end gap-6 pt-2">
        <div className="w-full sm:w-80 space-y-3 bg-muted/20 p-4 rounded-xl border border-border/80">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatINR(subtotal)}
            </span>
          </div>

          {/* Discount Percentage */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <Label htmlFor="discountPercent" className="text-muted-foreground text-xs shrink-0">
              Discount (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discountPercent || ''}
                onChange={(e) =>
                  onChangeDiscountPercent(parseFloat(e.target.value) || 0)
                }
                disabled={disabled}
                placeholder="0"
                className="w-16 h-7 text-xs text-right tabular-nums"
              />
              <span className="text-muted-foreground w-16 text-right tabular-nums">
                -{formatINR(discountAmount)}
              </span>
            </div>
          </div>

          {/* Tax Percentage */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <Label htmlFor="taxPercent" className="text-muted-foreground text-xs shrink-0">
              Tax / GST (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="taxPercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxPercent || ''}
                onChange={(e) =>
                  onChangeTaxPercent(parseFloat(e.target.value) || 0)
                }
                disabled={disabled}
                placeholder="0"
                className="w-16 h-7 text-xs text-right tabular-nums"
              />
              <span className="text-muted-foreground w-16 text-right tabular-nums">
                +{formatINR(taxAmount)}
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-border text-foreground">
            <span>Total Amount</span>
            <span className="text-primary tabular-nums text-base">
              {formatINR(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

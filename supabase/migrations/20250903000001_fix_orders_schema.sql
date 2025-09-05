-- ==========================================
-- Fix Orders Schema Migration
-- Ensures orders table has all required columns
-- ==========================================

-- Check if orders table exists and add missing columns if needed
DO $$
BEGIN
    -- Add total_amount column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_amount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
    END IF;

    -- Add guest_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'guest_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN guest_name TEXT;
    END IF;

    -- Add shipping_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_address JSONB;
    END IF;

    -- Add billing_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'billing_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN billing_address JSONB;
    END IF;

    -- Add tracking_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tracking_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
    END IF;

    -- Add shipped_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipped_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add delivered_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivered_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Ensure order_tracking table exists with correct structure
CREATE TABLE IF NOT EXISTS public.order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    location TEXT,
    tracking_number TEXT,
    carrier TEXT,
    estimated_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order_tracking if they don't exist
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);

-- Enable RLS on order_tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for order_tracking
DROP POLICY IF EXISTS "Users can view tracking for their orders" ON public.order_tracking;
CREATE POLICY "Users can view tracking for their orders" ON public.order_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_tracking.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

DROP POLICY IF EXISTS "Service role can manage order tracking" ON public.order_tracking;
CREATE POLICY "Service role can manage order tracking" ON public.order_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.order_tracking TO authenticated;
GRANT ALL ON public.order_tracking TO service_role;

-- Update the orders table to ensure total_amount is calculated correctly
-- for any existing orders that might have NULL total_amount
UPDATE public.orders 
SET total_amount = COALESCE(subtotal, 0) + COALESCE(tax_amount, 0) + COALESCE(shipping_amount, 0) - COALESCE(discount_amount, 0)
WHERE total_amount IS NULL OR total_amount = 0;

-- Create or replace the order update trigger
CREATE OR REPLACE FUNCTION public.update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_updated_at ON public.orders;
CREATE TRIGGER trigger_update_order_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_updated_at();

-- Create or replace the order tracking update trigger
CREATE OR REPLACE FUNCTION public.update_order_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_tracking_updated_at ON public.order_tracking;
CREATE TRIGGER trigger_update_order_tracking_updated_at
    BEFORE UPDATE ON public.order_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_tracking_updated_at();

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Address, AddressContextType } from '../types';
import {
  getUserAddresses,
  addAddress as addAddressDB,
  updateAddress as updateAddressDB,
  deleteAddress as deleteAddressDB,
  setDefaultAddress as setDefaultAddressDB
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (!context) throw new Error('useAddresses must be used within an AddressProvider');
  return context;
};

export const AddressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }

    setLoading(true);
    try {
      const addressesData = await getUserAddresses();
      setAddresses(addressesData);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch addresses'
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to add an address'
      });
      return;
    }

    try {
      const success = await addAddressDB(address);
      if (success) {
        await fetchAddresses();
        showNotification({
          type: 'success',
          title: 'Address Added',
          message: 'Your address has been added successfully'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to add address'
        });
      }
    } catch (error) {
      console.error('Error adding address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add address'
      });
    }
  };

  const updateAddress = async (address: Address) => {
    try {
      const success = await updateAddressDB(address);
      if (success) {
        await fetchAddresses();
        showNotification({
          type: 'success',
          title: 'Address Updated',
          message: 'Your address has been updated successfully'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update address'
        });
      }
    } catch (error) {
      console.error('Error updating address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update address'
      });
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const success = await deleteAddressDB(addressId);
      if (success) {
        await fetchAddresses();
        showNotification({
          type: 'success',
          title: 'Address Deleted',
          message: 'Your address has been deleted successfully'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete address'
        });
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete address'
      });
    }
  };

  const setDefaultAddress = async (addressId: string, type: 'shipping' | 'billing') => {
    try {
      const success = await setDefaultAddressDB(addressId, type);
      if (success) {
        await fetchAddresses();
        showNotification({
          type: 'success',
          title: 'Default Address Set',
          message: `Default ${type} address has been updated`
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to set default address'
        });
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to set default address'
      });
    }
  };

  const value: AddressContextType = {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    fetchAddresses,
    loading
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};

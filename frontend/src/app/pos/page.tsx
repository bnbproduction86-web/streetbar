'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePos } from '../../context/PosContext';
import { TouchscreenCashier } from '../../components/pos/TouchscreenCashier';

export default function PosPage() {
  const router = useRouter();
  const { 
    currentUser,
    outlet,
    products,
    categories,
    tables,
    customers,
    promotions,
    allStaff,
    activeShift,
    dbConnected,
    createOrder,
    openShift,
    closeShift,
    recordCashMovement,
    setCurrentUser,
    logout
  } = usePos();

  // If no user is logged in, redirect to login gate
  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <TouchscreenCashier
      outlet={outlet}
      products={products}
      categories={categories}
      tables={tables}
      customers={customers}
      promotions={promotions}
      currentStaff={currentUser}
      allStaff={allStaff}
      activeShift={activeShift}
      dbConnected={dbConnected}
      onOrderCompleted={createOrder}
      onOpenShift={openShift}
      onCloseShift={closeShift}
      onAddCashMovement={recordCashMovement}
      onSwitchStaff={setCurrentUser}
      onLogout={logout}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DashboardWorkspace } from "@/components/dashboard/workspace";
import { findAccount, getUser, logout, restoreUserFromFirebase, saveCurrentUser, saveRegisteredAccount } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";
import type { FactoryProfileDetails, User } from "@/types/user";

export default function FactoryDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [factoryProfile, setFactoryProfile] = useState<FactoryProfileDetails | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    async function initializeDashboard() {
      const storedUser = getUser();
      const currentUser = !storedUser || storedUser.role !== "FACTORY"
        ? (await restoreUserFromFirebase()) ?? storedUser
        : storedUser;
      if (!active) return;
      if (!currentUser || currentUser.role !== "FACTORY") {
        router.replace("/login");
        return;
      }

      const account = findAccount(currentUser.email);
      const localProfile: FactoryProfileDetails = {
        fullName: account?.role === "FACTORY" ? account.fullName : currentUser.fullName,
        email: currentUser.email,
        phone: account?.role === "FACTORY" ? account.phone || "" : "",
        companyName: account?.role === "FACTORY" ? account.companyName || "" : "",
        country: account?.role === "FACTORY" ? account.country || "" : "",
        city: account?.role === "FACTORY" ? account.city || "" : "",
        website: account?.role === "FACTORY" ? account.website || "" : "",
        monthlyCapacity: account?.role === "FACTORY" ? account.monthlyCapacity || 0 : 0,
        moq: account?.role === "FACTORY" ? account.moq || 0 : 0,
        processes: account?.role === "FACTORY" ? account.processes || [] : [],
        products: account?.role === "FACTORY" ? account.products || [] : [],
        workerCount: account?.role === "FACTORY" ? account.workerCount : undefined,
        productionLines: account?.role === "FACTORY" ? account.productionLines : undefined,
        machineInformation: account?.role === "FACTORY" ? account.machineInformation : undefined,
      };

      queueMicrotask(() => {
        if (active) {
          setUser(currentUser);
          setFactoryProfile(localProfile);
        }
      });

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser || firebaseUser.email?.toLowerCase() !== currentUser.email.toLowerCase()) return;
        try {
          const profileSnapshot = await getDoc(doc(db, "factories", firebaseUser.uid));
          if (!active || !profileSnapshot.exists()) return;

          const cloudProfile = profileSnapshot.data();
          setFactoryProfile((current) => ({
            ...(current ?? localProfile),
            fullName: cloudProfile.fullName || localProfile.fullName,
            phone: cloudProfile.phone || localProfile.phone,
            companyName: cloudProfile.companyName || localProfile.companyName,
            country: cloudProfile.country || localProfile.country,
            city: cloudProfile.city || localProfile.city,
            website: cloudProfile.website || localProfile.website,
            monthlyCapacity: Number(cloudProfile.monthlyCapacity) || localProfile.monthlyCapacity,
            moq: Number(cloudProfile.moq) || localProfile.moq,
            processes: Array.isArray(cloudProfile.processes) && cloudProfile.processes.length
              ? cloudProfile.processes
              : localProfile.processes,
            products: Array.isArray(cloudProfile.products) && cloudProfile.products.length
              ? cloudProfile.products
              : localProfile.products,
            workerCount: typeof cloudProfile.workerCount === "number"
              ? cloudProfile.workerCount
              : localProfile.workerCount,
            productionLines: typeof cloudProfile.productionLines === "number"
              ? cloudProfile.productionLines
              : localProfile.productionLines,
            machineInformation: typeof cloudProfile.machineInformation === "string"
              ? cloudProfile.machineInformation
              : localProfile.machineInformation,
          }));
        } catch (error) {
          console.error("[Factory profile] Failed to load Firestore profile:", error);
        }
      });
    }

    void initializeDashboard().catch((error: unknown) => {
      console.error("[Factory dashboard] Failed to restore the user session:", error);
      if (active) router.replace("/login");
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (!user || !factoryProfile) return null;
  const activeUser = user;

  async function saveFactoryProfile(profile: FactoryProfileDetails): Promise<string> {
    const account = findAccount(activeUser.email);
    const firebaseUser = auth.currentUser;
    const matchingFirebaseUser = firebaseUser?.email?.toLowerCase() === activeUser.email.toLowerCase()
      ? firebaseUser
      : null;

    if (account?.role === "FACTORY") {
      saveRegisteredAccount({ ...account, ...profile });
      setFactoryProfile(profile);
      const updatedUser = { ...activeUser, fullName: profile.fullName };
      saveCurrentUser(updatedUser);
      setUser(updatedUser);
    } else if (!matchingFirebaseUser) {
      throw new Error("Your factory account could not be found. Sign in again and retry.");
    }

    if (matchingFirebaseUser) {
      const {
        workerCount,
        productionLines,
        machineInformation,
        ...profileDetails
      } = profile;
      try {
        await setDoc(doc(db, "factories", matchingFirebaseUser.uid), {
          ...profileDetails,
          ...(workerCount === undefined ? {} : { workerCount }),
          ...(productionLines === undefined ? {} : { productionLines }),
          ...(machineInformation === undefined ? {} : { machineInformation }),
          id: matchingFirebaseUser.uid,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (error) {
        console.error("[Factory profile] Failed to sync profile to Firestore:", error);
        if (account?.role !== "FACTORY") {
          throw new Error("The profile could not be synced to Firebase. Please try again.");
        }
        return "Profile saved in this browser, but Firebase sync failed. Please try again later.";
      }
    }

    if (account?.role !== "FACTORY") {
      setFactoryProfile(profile);
      const updatedUser = { ...activeUser, fullName: profile.fullName };
      saveCurrentUser(updatedUser);
      setUser(updatedUser);
    }

    return matchingFirebaseUser
      ? "Factory profile saved and synced to Firebase."
      : "Factory profile saved in this browser account.";
  }

  return (
    <DashboardWorkspace
      role="factory"
      fullName={activeUser.fullName}
      userId={activeUser.id}
      userEmail={activeUser.email}
      factoryProfile={factoryProfile}
      onSaveFactoryProfile={saveFactoryProfile}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    />
  );
}

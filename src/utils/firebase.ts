// import * as FCMAdmin from "firebase-admin";
// import { Injectable } from "@nestjs/common";
// import { PrismaService } from "@/prisma/prisma.service";


// export default async FirebaseAdmin() {
//     const settings = await this.prisma.adminSettings.findFirst({
//         where: {
//             title: "app-settings",
//         }
//     })
//     const {
//         firebasePrivateKey,
//     } = settings?.metadata as Record<string, any> || {};
//     if (!firebasePrivateKey) throw new Error("Firebase private key not found.");

//     const firebaseCreds = typeof firebasePrivateKey === "string"
//         ? JSON.parse(firebasePrivateKey)
//         : firebasePrivateKey;

//     FCMAdmin.initializeApp({
//         credential: FCMAdmin.credential.cert(firebaseCreds),
//     });
// }


import { Injectable, OnModuleInit } from '@nestjs/common';
import * as FCMAdmin from 'firebase-admin';
import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.initializeFirebase();
    }

    private async initializeFirebase() {
        if (FCMAdmin.apps.length) return;

        const settings = await this.prisma.adminSettings.findFirst({
            where: { title: 'app-settings' },
        });

        if (!settings || !settings.metadata) {
            // throw new Error("App settings or metadata not found.");
            return "App settings or metadata not found.";
        }
        const metadata = settings.metadata as Record<string, any>;
        const firebasePrivateKey = metadata?.firebasePrivateKey;
        if (!firebasePrivateKey) {
            return 'Firebase private key not found.';
        }

        const firebaseCreds =
            typeof firebasePrivateKey === 'string'
                ? JSON.parse(firebasePrivateKey)
                : firebasePrivateKey;


        if (firebaseCreds.private_key?.includes('\\n')) {
            firebaseCreds.private_key = firebaseCreds.private_key.replace(/\\n/g, '\n');
        }

        FCMAdmin.initializeApp({
            credential: FCMAdmin.credential.cert(firebaseCreds),
        });
    }

    messaging(): FCMAdmin.messaging.Messaging {
        return FCMAdmin.messaging();
    }
}

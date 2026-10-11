import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { storeAsset } from '@/lib/storage';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid image file uploaded' }, { status: 400 });
    }

    const mimeType = file.type;
    const originalName = file.name || 'uploaded_logo.png';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate size and format
    const user = await getSessionUser();

    const stored = await storeAsset({
      buffer,
      fileName: originalName,
      mimeType,
      folder: 'threadcraft_customer_logos',
    });

    // Save record in DesignAsset table
    const asset = await prisma.designAsset.create({
      data: {
        userId: user?.id || null,
        fileUrl: stored.fileUrl,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        storageProvider: stored.storageProvider,
      },
    });

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        fileUrl: asset.fileUrl,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message || 'File upload failed' },
      { status: 400 }
    );
  }
}

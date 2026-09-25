CREATE TABLE "ArtisanContent" (
    "id" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "categories" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtisanContent_pkey" PRIMARY KEY ("id")
);

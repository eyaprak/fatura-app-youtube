import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createClient();

    // Toplam kayıt sayısı
    const { count: totalRecords, error: countError } = await supabase
      .from("fisler")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Toplam kayıt hatası:", countError);
      throw countError;
    }

    // Toplam tutar ve toplam KDV
    const { data: sumData, error: sumError } = await supabase
      .from("fisler")
      .select("total, total_kdv")
      .not("total", "is", null)
      .not("total_kdv", "is", null);

    if (sumError) {
      console.error("Toplam tutar hatası:", sumError);
      throw sumError;
    }

    // Bugünkü kayıtlar (bugün oluşturulan)
    const today = new Date().toISOString().split("T")[0];
    const { count: todayRecords, error: todayError } = await supabase
      .from("fisler")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);

    if (todayError) {
      console.error("Bugünkü kayıtlar hatası:", todayError);
      throw todayError;
    }

    // Hesaplamalar - TypeScript inference için explicit typing
    interface FisSum {
      total: number | null;
      total_kdv: number | null;
    }

    const totalAmount =
      sumData?.reduce(
        (sum: number, fis: FisSum) => sum + (fis.total || 0),
        0
      ) || 0;
    const totalTax =
      sumData?.reduce(
        (sum: number, fis: FisSum) => sum + (fis.total_kdv || 0),
        0
      ) || 0;
    const averageAmount =
      totalRecords && totalRecords > 0 ? totalAmount / totalRecords : 0;

    // İstatistik verilerini döndür
    const stats = {
      totalRecords: totalRecords || 0,
      totalAmount,
      totalTax,
      todayRecords: todayRecords || 0,
      averageAmount,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("İstatistik API hatası:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
        message: "İstatistik verileri alınırken hata oluştu",
      },
      { status: 500 }
    );
  }
}

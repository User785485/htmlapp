import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper pour formater la date
function formatDate(date: Date): string {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Helper pour formater la durée
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');
  const level = searchParams.get('level');
  const limit = parseInt(searchParams.get('limit') || '100');
  const stats = searchParams.get('stats') === 'true';

  try {
    // Si on demande les stats
    if (stats) {
      const { data, error } = await supabase
        .from('application_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const logs = data || [];
      
      // Calculer les statistiques
      const totalLogs = logs.length;
      const errorCount = logs.filter(log => log.level === 'error').length;
      const warningCount = logs.filter(log => log.level === 'warning').length;
      const successCount = logs.filter(log => log.level === 'success').length;
      const infoCount = logs.filter(log => log.level === 'info').length;

      // Statistiques par action
      const actionStats: Record<string, { count: number, avgDuration: number, errors: number }> = {};
      
      logs.forEach(log => {
        if (log.action) {
          if (!actionStats[log.action]) {
            actionStats[log.action] = { count: 0, avgDuration: 0, errors: 0 };
          }
          actionStats[log.action].count++;
          if (log.duration) {
            actionStats[log.action].avgDuration += log.duration;
          }
          if (log.level === 'error') {
            actionStats[log.action].errors++;
          }
        }
      });

      // Calculer les moyennes
      Object.keys(actionStats).forEach(action => {
        if (actionStats[action].avgDuration > 0) {
          actionStats[action].avgDuration = Math.round(
            actionStats[action].avgDuration / actionStats[action].count
          );
        }
      });

      // Tendances sur 24h
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const logsLast24h = logs.filter(log => 
        new Date(log.timestamp) > yesterday
      ).length;

      return NextResponse.json({
        success: true,
        stats: {
          total: totalLogs,
          levels: {
            error: errorCount,
            warning: warningCount,
            success: successCount,
            info: infoCount
          },
          actions: actionStats,
          last24h: logsLast24h,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Construction de la requête
    let query = supabase
      .from('application_logs')
      .select('*');

    // Filtres
    if (filter) {
      query = query.or(`action.ilike.%${filter}%,message.ilike.%${filter}%,details.ilike.%${filter}%`);
    }

    if (level && level !== 'all') {
      query = query.eq('level', level);
    }

    // Tri et limite
    query = query
      .order('timestamp', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    // Formater les logs pour l'affichage
    const formattedLogs = (data || []).map(log => ({
      ...log,
      formattedDate: formatDate(new Date(log.timestamp)),
      formattedDuration: log.duration ? formatDuration(log.duration) : null
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}

// Endpoint pour supprimer les anciens logs
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Supprimer les logs plus anciens que la date limite
    const { data, error } = await supabase
      .from('application_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('*');

    if (error) {
      throw error;
    }

    const deletedCount = data ? data.length : 0;

    return NextResponse.json({
      success: true,
      message: `${deletedCount} logs supprimés (plus anciens que ${days} jours)`,
      deletedCount
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}

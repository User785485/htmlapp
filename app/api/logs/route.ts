import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/api-wrapper';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase-client';

interface LogFilter {
  level?: string;
  component?: string;
  startDate?: string;
  endDate?: string;
  clientEmail?: string;
  limit?: number;
  offset?: number;
}

export const GET = withApiLogging('API_LOGS', async (request, context) => {
  try {
    // Parser les paramètres de requête
    const { searchParams } = new URL(request.url);
    const filter: LogFilter = {
      level: searchParams.get('level') || undefined,
      component: searchParams.get('component') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      clientEmail: searchParams.get('clientEmail') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    logger.info('API_LOGS', 'fetch_logs', 'Récupération des logs', {
      filter,
      request_id: context.requestId,
    });

    // Construire la requête Supabase
    let query = supabaseAdmin
      .from('application_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    // Appliquer les filtres
    if (filter.level) {
      query = query.eq('level', filter.level);
    }
    if (filter.component) {
      query = query.eq('component', filter.component);
    }
    if (filter.clientEmail) {
      query = query.eq('client_email', filter.clientEmail);
    }
    if (filter.startDate) {
      query = query.gte('timestamp', filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte('timestamp', filter.endDate);
    }

    // Pagination
    query = query.range(filter.offset!, filter.offset! + filter.limit! - 1);

    // Exécuter la requête
    const { data: logs, error, count } = await query;

    if (error) {
      throw error;
    }

    // Récupérer les statistiques
    const statsQuery = supabaseAdmin
      .from('application_logs')
      .select('level', { count: 'exact' });

    // Appliquer les mêmes filtres pour les stats
    if (filter.component) {
      statsQuery.eq('component', filter.component);
    }
    if (filter.clientEmail) {
      statsQuery.eq('client_email', filter.clientEmail);
    }
    if (filter.startDate) {
      statsQuery.gte('timestamp', filter.startDate);
    }
    if (filter.endDate) {
      statsQuery.lte('timestamp', filter.endDate);
    }

    const { data: levelStats } = await statsQuery;

    // Compter par niveau
    const stats = {
      total: count || 0,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      },
    };

    // Calculer les stats par niveau (méthode alternative)
    if (logs) {
      logs.forEach((log: any) => {
        if (stats.byLevel[log.level as keyof typeof stats.byLevel] !== undefined) {
          stats.byLevel[log.level as keyof typeof stats.byLevel]++;
        }
      });
    }

    return NextResponse.json({
      logs: logs || [],
      stats,
      pagination: {
        limit: filter.limit,
        offset: filter.offset,
        total: count || 0,
      },
    });

  } catch (error) {
    logger.error('API_LOGS', 'fetch_error', 'Erreur lors de la récupération des logs', {
      error: error instanceof Error ? error.message : error,
      request_id: context.requestId,
    });
    throw error;
  }
});

// Route pour supprimer les anciens logs
export const DELETE = withApiLogging('API_LOGS', async (request, context) => {
  try {
    const { days } = await request.json();
    
    if (!days || days < 1) {
      throw new Error('Le nombre de jours doit être supérieur à 0');
    }

    logger.warn('API_LOGS', 'delete_old_logs', `Suppression des logs de plus de ${days} jours`, {
      days,
      request_id: context.requestId,
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { error, count } = await supabaseAdmin
      .from('application_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    logger.info('API_LOGS', 'logs_deleted', `${count} logs supprimés`, {
      days,
      count,
      cutoff_date: cutoffDate.toISOString(),
      request_id: context.requestId,
    });

    return NextResponse.json({
      success: true,
      deleted: count,
      message: `${count} logs supprimés (plus de ${days} jours)`,
    });

  } catch (error) {
    logger.error('API_LOGS', 'delete_error', 'Erreur lors de la suppression des logs', {
      error: error instanceof Error ? error.message : error,
      request_id: context.requestId,
    });
    throw error;
  }
});
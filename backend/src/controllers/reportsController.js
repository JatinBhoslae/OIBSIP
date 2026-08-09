import { generateCSVReport, generateExcelReport, generatePDFReport } from '../services/ReportService.js';

export const exportCSV = async (req, res, next) => {
  try {
    const reportType = req.query.type || 'sales';
    const range = req.query.range || '30days';
    const csv = await generateCSVReport(reportType, range);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=PizzaHub_${reportType}_report.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportExcel = async (req, res, next) => {
  try {
    const reportType = req.query.type || 'sales';
    const range = req.query.range || '30days';
    const html = await generateExcelReport(reportType, range);

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename=PizzaHub_${reportType}_report.xls`);
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

export const exportPDF = async (req, res, next) => {
  try {
    const reportType = req.query.type || 'sales';
    const range = req.query.range || '30days';
    const html = await generatePDFReport(reportType, range);

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

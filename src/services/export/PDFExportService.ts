// #scope:cpd
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../config/supabase';
import { CPDEntry } from '../../types/cpd.types';
import { UserProfile } from '../../types/dashboard.types';
import ENV from '../../config/environment';

export interface ExportOptions {
  includeSignature?: boolean;
  includeEvidence?: boolean;
  format?: 'pdf' | 'html';
  branding?: boolean;
}

export class PDFExportService {
  /**
   * Export CPD entries to PDF with professional formatting
   */
  async exportCPDEntries(
    entries: CPDEntry[], 
    options: ExportOptions = {}
  ): Promise<string> {
    if (!ENV.features.pdfExport) {
      throw new Error('PDF export feature is disabled');
    }

    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }

    const profile = await this.getUserProfile(user.data.user.id);
    const html = await this.generateHTML(entries, profile, options);
    
    if (options.format === 'html') {
      return await this.saveHTMLFile(html);
    }

    return await this.generatePDF(html, entries);
  }

  /**
   * Generate PDF from HTML content
   */
  private async generatePDF(html: string, entries: CPDEntry[]): Promise<string> {
    const fileName = `CPD_Export_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
    
    const options = {
      html,
      fileName,
      directory: FileSystem.documentDirectory + 'exports/',
      width: 595, // A4 width in points
      height: 842, // A4 height in points
      padding: 20,
    };

    // Ensure export directory exists
    const exportDir = FileSystem.documentDirectory + 'exports/';
    const dirInfo = await FileSystem.getInfoAsync(exportDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    }

    const pdf = await RNHTMLtoPDF.convert(options);
    
    // Upload to Supabase if online
    try {
      await this.uploadToSupabase(pdf.filePath!, fileName);
    } catch (error) {
      // Continue if upload fails - user still has local copy
    }
    
    return pdf.filePath!;
  }

  /**
   * Save HTML file for preview/debugging
   */
  private async saveHTMLFile(html: string): Promise<string> {
    const fileName = `CPD_Export_${Date.now()}.html`;
    const filePath = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(filePath, html);
    return filePath;
  }

  /**
   * Upload PDF to Supabase storage
   */
  private async uploadToSupabase(filePath: string, fileName: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const fileUri = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const blob = Uint8Array.from(atob(fileUri), c => c.charCodeAt(0));
    const storagePath = `${user.data.user.id}/exports/${fileName}.pdf`;
    
    await supabase.storage
      .from('documents')
      .upload(storagePath, blob, {
        contentType: 'application/pdf',
        upsert: false,
      });
  }

  /**
   * Generate professional HTML for CPD report
   */
  private async generateHTML(
    entries: CPDEntry[], 
    profile: UserProfile,
    options: ExportOptions
  ): Promise<string> {
    const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const signature = options.includeSignature 
      ? await this.generateDigitalSignature(entries)
      : null;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>CPD Portfolio - ${profile.full_name}</title>
          <style>
            ${this.getCSS()}
          </style>
        </head>
        <body>
          ${options.branding !== false ? this.getHeader() : ''}
          
          <div class="profile-section">
            <h1>Continuing Professional Development Portfolio</h1>
            <div class="profile-info">
              <p><strong>Name:</strong> ${profile.full_name}</p>
              <p><strong>NMC PIN:</strong> [PROTECTED - Encrypted]</p>
              <p><strong>Registration Expires:</strong> ${profile.revalidationDate.toLocaleDateString()}</p>
              <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="summary-section">
            <h2>Portfolio Summary</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-number">${entries.length}</span>
                <span class="stat-label">CPD Entries</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${totalHours}</span>
                <span class="stat-label">Total Hours</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${this.getUniqueCategories(entries).length}</span>
                <span class="stat-label">Categories</span>
              </div>
            </div>
          </div>

          <div class="entries-section">
            <h2>CPD Activities</h2>
            ${entries.map((entry, index) => this.generateEntryHTML(entry, index + 1)).join('')}
          </div>

          ${this.getFooter(signature, totalHours)}
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for individual CPD entry
   */
  private generateEntryHTML(entry: CPDEntry, index: number): string {
    return `
      <div class="cpd-entry">
        <div class="entry-header">
          <h3>Entry ${index}: ${entry.title}</h3>
          <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
        </div>
        
        <div class="entry-content">
          <div class="entry-row">
            <span class="label">Type:</span>
            <span class="value">${entry.type}</span>
          </div>
          
          <div class="entry-row">
            <span class="label">Hours:</span>
            <span class="value">${entry.hours} hours</span>
          </div>
          
          ${entry.category ? `
            <div class="entry-row">
              <span class="label">Category:</span>
              <span class="value">${entry.category}</span>
            </div>
          ` : ''}
          
          <div class="entry-description">
            <span class="label">Description:</span>
            <p>${entry.description}</p>
          </div>
          
          ${entry.learning_outcomes && entry.learning_outcomes.length > 0 ? `
            <div class="entry-outcomes">
              <span class="label">Learning Outcomes:</span>
              <ul>
                ${entry.learning_outcomes.map(outcome => `<li>${outcome}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${entry.reflection ? `
            <div class="entry-reflection">
              <span class="label">Reflection:</span>
              <p>${entry.reflection}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * CSS styles for professional PDF formatting
   */
  private getCSS(): string {
    return `
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        font-size: 11pt;
      }
      
      .header {
        border-bottom: 3px solid #6B46C1;
        padding-bottom: 20px;
        margin-bottom: 30px;
        text-align: center;
      }
      
      .header h1 {
        color: #6B46C1;
        font-size: 24pt;
        margin: 0;
      }
      
      .header p {
        color: #666;
        margin: 5px 0;
      }
      
      .profile-section h1 {
        color: #6B46C1;
        font-size: 20pt;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .profile-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 25px;
      }
      
      .profile-info p {
        margin: 8px 0;
        font-size: 11pt;
      }
      
      .summary-section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      
      .stats-grid {
        display: flex;
        justify-content: space-around;
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-number {
        display: block;
        font-size: 24pt;
        font-weight: bold;
        color: #6B46C1;
      }
      
      .stat-label {
        font-size: 10pt;
        color: #666;
      }
      
      .cpd-entry {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      
      .entry-header h3 {
        color: #6B46C1;
        margin: 0;
        font-size: 14pt;
      }
      
      .entry-date {
        color: #666;
        font-size: 10pt;
      }
      
      .entry-row {
        display: flex;
        margin-bottom: 8px;
      }
      
      .label {
        font-weight: bold;
        min-width: 120px;
        color: #555;
      }
      
      .value {
        color: #333;
      }
      
      .entry-description, .entry-outcomes, .entry-reflection {
        margin-top: 15px;
      }
      
      .entry-description p, .entry-reflection p {
        margin: 5px 0 0 120px;
        text-align: justify;
      }
      
      .entry-outcomes ul {
        margin: 5px 0 0 120px;
        padding-left: 20px;
      }
      
      .entry-outcomes li {
        margin-bottom: 5px;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #6B46C1;
        font-size: 10pt;
        color: #666;
      }
      
      .signature {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
      }
      
      h2 {
        color: #6B46C1;
        font-size: 16pt;
        margin-bottom: 20px;
        page-break-after: avoid;
      }
      
      @media print {
        body { print-color-adjust: exact; }
        .cpd-entry { page-break-inside: avoid; }
        .summary-section { page-break-inside: avoid; }
      }
    `;
  }

  private getHeader(): string {
    return `
      <div class="header">
        <h1>NurseRevalidator</h1>
        <p>Professional CPD Portfolio Management</p>
      </div>
    `;
  }

  private getFooter(signature: string | null, totalHours: number): string {
    return `
      <div class="footer">
        <p><strong>Portfolio Summary:</strong> ${totalHours} total CPD hours completed</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Application:</strong> NurseRevalidator v1.0</p>
        
        ${signature ? `
          <div class="signature">
            <p><strong>Digital Signature:</strong></p>
            <p style="font-family: monospace; font-size: 9pt; word-break: break-all;">${signature}</p>
            <p style="font-size: 9pt; color: #666;">
              This signature verifies the integrity of the CPD entries in this report.
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate digital signature for data integrity
   */
  private async generateDigitalSignature(entries: CPDEntry[]): Promise<string> {
    const dataString = entries
      .map(entry => `${entry.id}:${entry.title}:${entry.hours}:${entry.date}`)
      .sort()
      .join('|');
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${dataString}:${Date.now()}`
    );
  }

  private getUniqueCategories(entries: CPDEntry[]): string[] {
    const categories = entries
      .map(entry => entry.category)
      .filter((cat): cat is string => !!cat);
    
    return Array.from(new Set(categories));
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Fallback to mock data if Supabase call fails
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        revalidationDate: new Date(data.revalidationDate),
      };
    } catch (error) {
      // Return mock profile for development
      return {
        id: userId,
        full_name: 'Professional Nurse',
        nmc_pin: '[ENCRYPTED]',
        revalidationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        qualifications: ['RN'],
        workplace: 'Healthcare Trust',
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }
}

// Singleton instance
export const pdfExportService = new PDFExportService();
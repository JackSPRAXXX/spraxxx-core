#!/usr/bin/env node

/**
 * SPRAXXX SEO Tools
 * Generates sitemap.xml and validates SEO elements
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://spraxxx.com';
const PUBLIC_DIR = path.join(__dirname, '../public');

// Page configuration for sitemap generation
const pages = [
    {
        url: '/',
        priority: '1.0',
        changefreq: 'weekly',
        file: 'index.html'
    },
    {
        url: '/about',
        priority: '0.8',
        changefreq: 'monthly',
        file: 'about.html'
    },
    {
        url: '/covenant',
        priority: '0.8',
        changefreq: 'monthly',
        file: 'covenant.html'
    },
    {
        url: '/contact',
        priority: '0.6',
        changefreq: 'monthly',
        file: 'contact.html'
    }
];

/**
 * Generate sitemap.xml
 */
function generateSitemap() {
    const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Filter pages that actually exist
    const existingPages = pages.filter(page => {
        const filePath = path.join(PUBLIC_DIR, page.file);
        return fs.existsSync(filePath);
    });
    
    existingPages.forEach(page => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${DOMAIN}${page.url}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${page.priority}</priority>\n`;
        sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap);
    console.log(`✅ Generated sitemap.xml with ${existingPages.length} pages`);
}

/**
 * Validate SEO elements in HTML files
 */
function validateSEO() {
    console.log('\n🔍 SEO Validation Report\n');
    
    const htmlFiles = fs.readdirSync(PUBLIC_DIR)
        .filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const content = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
        
        console.log(`📄 ${file}:`);
        
        // Check for essential meta tags
        const checks = [
            { name: 'Title tag', regex: /<title[^>]*>([^<]+)<\/title>/i },
            { name: 'Meta description', regex: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i },
            { name: 'Meta keywords', regex: /<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i },
            { name: 'Viewport meta', regex: /<meta[^>]*name=["']viewport["'][^>]*>/i },
            { name: 'Canonical URL', regex: /<link[^>]*rel=["']canonical["'][^>]*>/i },
            { name: 'Open Graph title', regex: /<meta[^>]*property=["']og:title["'][^>]*>/i },
            { name: 'Open Graph description', regex: /<meta[^>]*property=["']og:description["'][^>]*>/i },
            { name: 'Structured data', regex: /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i },
            { name: 'H1 tag', regex: /<h1[^>]*>([^<]+)<\/h1>/i }
        ];
        
        checks.forEach(check => {
            const match = content.match(check.regex);
            if (match) {
                console.log(`  ✅ ${check.name}: ${match[1] ? `"${match[1].substring(0, 50)}..."` : 'Found'}`);
            } else {
                console.log(`  ❌ ${check.name}: Missing`);
            }
        });
        
        // Check for performance indicators
        const hasInlineCSS = content.includes('<style>');
        const hasExternalCSS = content.includes('<link rel="stylesheet"');
        
        if (hasInlineCSS) {
            console.log('  ✅ Inline CSS: Found (good for performance)');
        } else if (hasExternalCSS) {
            console.log('  ⚠️  External CSS: Found (consider inlining critical CSS)');
        } else {
            console.log('  ❌ CSS: No styling found');
        }
        
        console.log('');
    });
}

/**
 * Check for required SEO files
 */
function checkSEOFiles() {
    console.log('📋 SEO Files Check:\n');
    
    const requiredFiles = [
        'robots.txt',
        'sitemap.xml',
        '.htaccess'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file}: Found`);
        } else {
            console.log(`❌ ${file}: Missing`);
        }
    });
    
    console.log('');
}

/**
 * Main function
 */
function main() {
    console.log('🚀 SPRAXXX SEO Tools\n');
    
    const command = process.argv[2];
    
    switch (command) {
        case 'generate':
            generateSitemap();
            break;
        case 'validate':
            validateSEO();
            break;
        case 'check':
            checkSEOFiles();
            break;
        case 'all':
        default:
            generateSitemap();
            checkSEOFiles();
            validateSEO();
            break;
    }
    
    console.log('✨ SEO tools execution complete!\n');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateSitemap,
    validateSEO,
    checkSEOFiles
};
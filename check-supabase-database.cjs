const https = require('https');

// Your Supabase access token
const accessToken = 'sbp_4406718fb2ef91d08056153caa9ab9590684673f';

// Function to make authenticated requests to Supabase
function makeSupabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-CLI/1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ data: jsonBody, status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkSupabaseDatabase() {
  console.log('🔍 Checking Supabase Database with Access Token...');
  console.log('🔑 Access Token:', accessToken.substring(0, 20) + '...');
  console.log('');

  try {
    // First, let's try to get project information
    console.log('1. Getting project information...');
    const { data: projects, status: projectsStatus } = await makeSupabaseRequest('/v1/projects');
    
    if (projectsStatus === 200) {
      console.log('✅ Successfully connected to Supabase API');
      console.log('📋 Available projects:');
      if (projects && projects.length > 0) {
        projects.forEach(project => {
          console.log(`  - ${project.name} (${project.id}) - ${project.status}`);
          console.log(`    URL: ${project.url}`);
        });
      } else {
        console.log('  No projects found');
      }
    } else {
      console.log(`❌ Failed to get projects: ${projectsStatus}`);
      console.log('Response:', projects);
    }

    // Try to get the specific project we're working with
    console.log('');
    console.log('2. Getting specific project details...');
    const projectId = 'xqqjxcmgjivjytzzisyf'; // From your URL
    const { data: project, status: projectStatus } = await makeSupabaseRequest(`/v1/projects/${projectId}`);
    
    if (projectStatus === 200) {
      console.log('✅ Project details:');
      console.log(`  Name: ${project.name}`);
      console.log(`  Status: ${project.status}`);
      console.log(`  URL: ${project.url}`);
      console.log(`  Database URL: ${project.db_url ? 'Set' : 'Not set'}`);
    } else {
      console.log(`❌ Failed to get project details: ${projectStatus}`);
    }

    // Try to get database tables using the project's database URL
    console.log('');
    console.log('3. Attempting to query database tables...');
    
    // We'll try to use the Supabase REST API to query the database
    const { data: tables, status: tablesStatus } = await makeSupabaseRequest(`/v1/projects/${projectId}/tables`);
    
    if (tablesStatus === 200) {
      console.log('✅ Database tables:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`  - ${table.name} (${table.schema})`);
        });
      } else {
        console.log('  No tables found via API');
      }
    } else {
      console.log(`❌ Failed to get tables via API: ${tablesStatus}`);
    }

    // Try to query specific tables using the REST API
    console.log('');
    console.log('4. Testing table access via REST API...');
    
    const testTables = ['profiles', 'orders', 'products', 'categories'];
    const projectUrl = 'https://xqqjxcmgjivjytzzisyf.supabase.co';
    
    for (const tableName of testTables) {
      try {
        const { data: tableData, status: tableStatus } = await makeSupabaseRequest(`/rest/v1/${tableName}?select=count`);
        
        if (tableStatus === 200) {
          console.log(`✅ ${tableName}: Accessible`);
        } else {
          console.log(`❌ ${tableName}: ${tableStatus} - ${tableData}`);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking Supabase database:', error);
  }
}

checkSupabaseDatabase();

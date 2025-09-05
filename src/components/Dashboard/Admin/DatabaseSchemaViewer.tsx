import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Table,
  Key,
  Link,
  Search,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

interface TableSchema {
  name: string;
  displayName: string;
  columns: TableColumn[];
  relationships: {
    hasMany: string[];
    belongsTo: string[];
  };
  position: { x: number; y: number };
  color: string;
}

export const DatabaseSchemaViewer: React.FC = () => {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showRelationships, setShowRelationships] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Define the database schema with relationships
  const databaseSchema: TableSchema[] = [
    {
      name: 'profiles',
      displayName: 'User Profiles',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'email', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'full_name', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'avatar_url', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'role', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'phone', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'date_of_birth', type: 'date', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'is_active', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'email_verified', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: ['orders', 'cart_items', 'wishlist_items', 'reviews', 'addresses', 'payment_methods', 'user_preferences', 'user_security_settings'],
        belongsTo: []
      },
      position: { x: 100, y: 100 },
      color: 'bg-blue-500'
    },
    {
      name: 'user_preferences',
      displayName: 'User Preferences',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'email_order_updates', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'email_promotions', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'email_newsletter', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'push_order_updates', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'language', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'timezone', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'currency', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['profiles']
      },
      position: { x: 400, y: 50 },
      color: 'bg-indigo-500'
    },
    {
      name: 'user_security_settings',
      displayName: 'Security Settings',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'two_factor_enabled', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'two_factor_method', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'login_alerts', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'session_timeout', type: 'integer', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'password_changed_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'failed_login_attempts', type: 'integer', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['profiles']
      },
      position: { x: 400, y: 150 },
      color: 'bg-red-500'
    },
    {
      name: 'categories',
      displayName: 'Categories',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'name', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'slug', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'description', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'parent_id', type: 'uuid', nullable: true, isPrimaryKey: false, isForeignKey: true, referencedTable: 'categories', referencedColumn: 'id' },
        { name: 'is_active', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: ['products'],
        belongsTo: ['categories']
      },
      position: { x: 700, y: 100 },
      color: 'bg-purple-500'
    },
    {
      name: 'products',
      displayName: 'Products',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'name', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'slug', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'price', type: 'numeric', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'category_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'categories', referencedColumn: 'id' },
        { name: 'seller_id', type: 'uuid', nullable: true, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'stock', type: 'integer', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: ['order_items', 'cart_items', 'wishlist_items', 'reviews', 'product_variants'],
        belongsTo: ['categories', 'profiles']
      },
      position: { x: 1000, y: 100 },
      color: 'bg-green-500'
    },
    {
      name: 'addresses',
      displayName: 'Addresses',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'type', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'full_name', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'street_address', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'city', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'state', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'postal_code', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'country', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'phone', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'is_default', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['profiles']
      },
      position: { x: 100, y: 300 },
      color: 'bg-teal-500'
    },
    {
      name: 'payment_methods',
      displayName: 'Payment Methods',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'type', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'provider', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'last_four', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'expiry_month', type: 'integer', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'expiry_year', type: 'integer', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'holder_name', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'is_default', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'is_verified', type: 'boolean', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['profiles']
      },
      position: { x: 100, y: 450 },
      color: 'bg-pink-500'
    },
    {
      name: 'orders',
      displayName: 'Orders',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'order_number', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'status', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'total_amount', type: 'numeric', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: ['order_items', 'order_tracking'],
        belongsTo: ['profiles']
      },
      position: { x: 400, y: 300 },
      color: 'bg-orange-500'
    },
    {
      name: 'order_items',
      displayName: 'Order Items',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'order_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'orders', referencedColumn: 'id' },
        { name: 'product_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'products', referencedColumn: 'id' },
        { name: 'quantity', type: 'integer', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'unit_price', type: 'numeric', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'total_price', type: 'numeric', nullable: false, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['orders', 'products']
      },
      position: { x: 700, y: 300 },
      color: 'bg-orange-400'
    },
    {
      name: 'cart_items',
      displayName: 'Cart Items',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'product_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'products', referencedColumn: 'id' },
        { name: 'quantity', type: 'integer', nullable: false, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['profiles', 'products']
      },
      position: { x: 1000, y: 300 },
      color: 'bg-yellow-500'
    },
    {
      name: 'reviews',
      displayName: 'Reviews',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'product_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'products', referencedColumn: 'id' },
        { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'profiles', referencedColumn: 'id' },
        { name: 'rating', type: 'integer', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'comment', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false, isForeignKey: false }
      ],
      relationships: {
        hasMany: [],
        belongsTo: ['products', 'profiles']
      },
      position: { x: 1000, y: 450 },
      color: 'bg-yellow-600'
    }
  ];

  useEffect(() => {
    setTables(databaseSchema);
  }, [databaseSchema]);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    if (type.includes('uuid')) return <Key className="h-3 w-3" />;
    if (type.includes('text') || type.includes('varchar')) return <span className="text-xs">T</span>;
    if (type.includes('integer') || type.includes('numeric')) return <span className="text-xs">#</span>;
    if (type.includes('boolean')) return <span className="text-xs">B</span>;
    if (type.includes('timestamp') || type.includes('date')) return <span className="text-xs">D</span>;
    return <span className="text-xs">?</span>;
  };

  const renderRelationshipLines = () => {
    if (!showRelationships) return null;

    const lines: JSX.Element[] = [];
    
    tables.forEach(table => {
      table.relationships.belongsTo.forEach(relatedTableName => {
        const relatedTable = tables.find(t => t.name === relatedTableName);
        if (relatedTable) {
          const startX = table.position.x + 150;
          const startY = table.position.y + 50;
          const endX = relatedTable.position.x + 150;
          const endY = relatedTable.position.y + 50;

          lines.push(
            <line
              key={`${table.name}-${relatedTableName}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#6B7280"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          );
        }
      });
    });

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {lines}
      </svg>
    );
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="h-6 w-6 mr-2 text-primary" />
            Database Schema
          </h1>
          <p className="text-gray-600">Interactive visualization of database structure and relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowRelationships(!showRelationships)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              showRelationships ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link className="h-4 w-4 mr-2" />
            Relationships
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Schema Visualization */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '600px' }}>
        <div className="relative w-full h-full overflow-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          {renderRelationshipLines()}
          
          {filteredTables.map((table) => (
            <motion.div
              key={table.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
                selectedTable === table.name ? 'border-primary shadow-lg' : 'border-gray-200'
              }`}
              style={{
                left: table.position.x,
                top: table.position.y,
                width: '300px',
                zIndex: selectedTable === table.name ? 10 : 1
              }}
              onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
            >
              {/* Table Header */}
              <div className={`${table.color} text-white p-3 rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Table className="h-4 w-4 mr-2" />
                    <h3 className="font-semibold text-sm">{table.displayName}</h3>
                  </div>
                  <span className="text-xs opacity-75">{table.name}</span>
                </div>
              </div>

              {/* Table Columns */}
              <div className="p-3 max-h-64 overflow-y-auto">
                <div className="space-y-1">
                  {table.columns.map((column) => (
                    <div
                      key={column.name}
                      className={`flex items-center justify-between p-2 rounded text-xs ${
                        column.isPrimaryKey ? 'bg-yellow-50 border border-yellow-200' :
                        column.isForeignKey ? 'bg-blue-50 border border-blue-200' :
                        'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-4 h-4 flex items-center justify-center mr-2">
                          {column.isPrimaryKey ? (
                            <Key className="h-3 w-3 text-yellow-600" />
                          ) : column.isForeignKey ? (
                            <Link className="h-3 w-3 text-blue-600" />
                          ) : (
                            getTypeIcon(column.type)
                          )}
                        </div>
                        <span className={`font-medium ${column.isPrimaryKey ? 'text-yellow-800' : column.isForeignKey ? 'text-blue-800' : 'text-gray-700'}`}>
                          {column.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">{column.type}</span>
                        {!column.nullable && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationships Summary */}
              {(table.relationships.hasMany.length > 0 || table.relationships.belongsTo.length > 0) && (
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
                  <div className="text-xs text-gray-600">
                    {table.relationships.hasMany.length > 0 && (
                      <div className="mb-1">
                        <span className="font-medium">Has many:</span> {table.relationships.hasMany.join(', ')}
                      </div>
                    )}
                    {table.relationships.belongsTo.length > 0 && (
                      <div>
                        <span className="font-medium">Belongs to:</span> {table.relationships.belongsTo.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            -
          </button>
          <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            +
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center">
            <Key className="h-3 w-3 text-yellow-600 mr-1" />
            Primary Key
          </div>
          <div className="flex items-center">
            <Link className="h-3 w-3 text-blue-600 mr-1" />
            Foreign Key
          </div>
          <div className="flex items-center">
            <span className="text-red-500 mr-1">*</span>
            Required
          </div>
        </div>
      </div>
    </div>
  );
};

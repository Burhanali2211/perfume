module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    // Performance budgets
    budgets: [
      {
        path: '/*',
        resourceCounts: [
          { resourceType: 'script', budget: 15 },
          { resourceType: 'stylesheet', budget: 5 },
          { resourceType: 'image', budget: 30 },
          { resourceType: 'font', budget: 5 },
          { resourceType: 'document', budget: 1 },
          { resourceType: 'other', budget: 5 },
          { resourceType: 'total', budget: 50 }
        ],
        resourceSizes: [
          { resourceType: 'script', budget: 300 },
          { resourceType: 'stylesheet', budget: 50 },
          { resourceType: 'image', budget: 1000 },
          { resourceType: 'font', budget: 100 },
          { resourceType: 'document', budget: 200 },
          { resourceType: 'other', budget: 300 },
          { resourceType: 'total', budget: 1500 }
        ]
      }
    ]
  }
};
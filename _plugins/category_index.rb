# module Jekyll
#  
#   class CategoryIndexPage < Page
#     def initialize(site, base, keys)
#       @site = site
#       @base = base
#       @dir = ''
#       @name = 'categories.html'
#  
#       self.process(@name)
#       self.read_yaml(File.join(base, '_layouts'), 'category_index_page.html')
#       self.data['keys'] = keys
#  
#       self.data['title'] = "Categories"
#     end
#   end
#  
#   class CategoryIndexPageGenerator < Generator
#     safe true
#     
#     def generate(site)
#       if site.layouts.key? 'category_index_page'
#         print "generating category page"
#         site.pages << CategoryIndexPage.new(site, site.source, site.categories.keys)
#       end
#     end
#   end
#  
# end
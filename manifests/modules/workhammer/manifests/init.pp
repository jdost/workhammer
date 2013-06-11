class workhammer {
   if $vagrant == 1 {
      file { "/opt/workhammer":
         ensure => link,
         target => "/vagrant",
      }
   } else {
      # retrieve the codebase somehow (git or pull from a github tag?)
   }

   include workhammer::python

   exec { 'dependencies':
      require => [ Package['python-pip'], File["/opt/workhammer"] ],
      command => "/usr/bin/pip install -r /opt/workhammer/requirements.txt",
   }

   user { 'workhammer':
      ensure => present,
      home   => "/opt/workhammer",
   }

   include workhammer::supervisor

   file { '/etc/nginx/sites-available/workhammer.conf':
      ensure  => present,
      content => template('workhammer/nginx.conf.erb'),
   }

   file { '/etc/nginx/sites-enabled/workhammer.conf':
      ensure  => link,
      target  => '/etc/nginx/sites-available/workhammer.conf',
      require => File['/etc/nginx/sites-available/workhammer.conf'],
   }
}

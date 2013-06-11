class workhammer::python {
   package { 'python':
      ensure  => installed,
      require => Exec['update'],
   }

   package { 'python-pip':
      ensure  => installed,
      require => Package['python'],
   }
}
